from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import viewsets, filters, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.exceptions import PermissionDenied

from .models import Grade
from .serializers import GradeSerializer
from students.models import Student
from courses.models import Course
from accounts.permissions import IsAdminOrTeacherRole

class AppStatusView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        return Response({"status": "healthy", "app": "grades"})


class GradePagination(PageNumberPagination):
    page_size = 5
    page_size_query_param = 'page_size'
    max_page_size = 100


class GradeViewSet(viewsets.ModelViewSet):
    serializer_class = GradeSerializer
    pagination_class = GradePagination
    filter_backends = [filters.SearchFilter]
    search_fields = ['student__name', 'student__roll_no', 'course__course_code', 'course__course_name']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrTeacherRole()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Grade.objects.none()

        role = getattr(user, 'role', 'STUDENT')
        if role == 'ADMIN' or user.is_superuser or user.is_staff:
            return Grade.objects.all().select_related('student', 'course').order_by('-id')
        elif role == 'TEACHER':
            from teachers.models import Teacher
            try:
                teacher = Teacher.objects.get(email=user.email)
                courses = Course.objects.filter(teacher=teacher)
                return Grade.objects.filter(course__in=courses).select_related('student', 'course').order_by('-id')
            except Exception:
                return Grade.objects.none()
        elif role == 'STUDENT':
            try:
                student = Student.objects.get(email=user.email)
                return Grade.objects.filter(student=student).select_related('student', 'course').order_by('-id')
            except Exception:
                return Grade.objects.none()
        return Grade.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if getattr(user, 'role', 'STUDENT') == 'TEACHER' and not user.is_superuser:
            course = serializer.validated_data['course']
            from teachers.models import Teacher
            try:
                teacher = Teacher.objects.get(email=user.email)
                if course.teacher != teacher:
                    raise PermissionDenied("You can only grade students in your own courses.")
            except Teacher.DoesNotExist:
                raise PermissionDenied("Teacher profile not found.")
        serializer.save()

    def perform_update(self, serializer):
        user = self.request.user
        if getattr(user, 'role', 'STUDENT') == 'TEACHER' and not user.is_superuser:
            grade = self.get_object()
            from teachers.models import Teacher
            try:
                teacher = Teacher.objects.get(email=user.email)
                if grade.course.teacher != teacher:
                    raise PermissionDenied("You can only edit grades in your own courses.")
            except Teacher.DoesNotExist:
                raise PermissionDenied("Teacher profile not found.")
        serializer.save()


class StudentResultSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        student_id = request.query_params.get('student')
        if not student_id:
            return Response({"detail": "student query parameter is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Enforce Student profile ownership checks
        if getattr(request.user, 'role', 'STUDENT') == 'STUDENT' and not request.user.is_superuser:
            try:
                student = Student.objects.get(email=request.user.email)
                if str(student.id) != str(student_id):
                    return Response({"detail": "You can only view your own result summary."}, status=status.HTTP_403_FORBIDDEN)
            except Student.DoesNotExist:
                return Response({"detail": "Student profile not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            student = Student.objects.get(id=student_id)
        except Student.DoesNotExist:
            return Response({"detail": "Student not found."}, status=status.HTTP_404_NOT_FOUND)

        # Get all grades for this student
        student_grades = Grade.objects.filter(student=student).select_related('course')
        
        # GPA point mapping
        grade_points_map = {
            'A+': 4.0,
            'A': 4.0,
            'B': 3.0,
            'C': 2.0,
            'D': 1.0,
            'F': 0.0
        }

        total_credit_hours = 0
        earned_credit_hours = 0
        weighted_points_sum = 0
        total_percentage_sum = 0.0
        courses_count = student_grades.count()

        results_breakdown = []
        for g in student_grades:
            credits = g.course.credit_hours
            total_credit_hours += credits
            
            # Map grade points
            pts = grade_points_map.get(g.grade, 0.0)
            weighted_points_sum += pts * credits
            total_percentage_sum += float(g.total_marks or 0.0)

            if g.grade != 'F':
                earned_credit_hours += credits

            results_breakdown.append({
                "grade_id": g.id,
                "course_code": g.course.course_code,
                "course_name": g.course.course_name,
                "credit_hours": credits,
                "quiz_marks": float(g.quiz_marks),
                "mid_marks": float(g.mid_marks),
                "final_marks": float(g.final_marks),
                "total_marks": float(g.total_marks or 0.0),
                "grade": g.grade
            })

        # Calculate GPA
        gpa = 0.0
        if total_credit_hours > 0:
            gpa = round(weighted_points_sum / total_credit_hours, 2)

        average_percentage = 0.0
        if courses_count > 0:
            average_percentage = round(total_percentage_sum / courses_count, 1)

        return Response({
            "student_id": student.id,
            "roll_no": student.roll_no,
            "name": student.name,
            "gpa": gpa,
            "total_credits": total_credit_hours,
            "earned_credits": earned_credit_hours,
            "average_percentage": average_percentage,
            "results": results_breakdown
        }, status=status.HTTP_200_OK)

