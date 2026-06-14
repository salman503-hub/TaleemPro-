from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import viewsets, filters, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.decorators import action
from django.contrib.auth import get_user_model

from .models import Course, Enrollment, Department, Semester, Curriculum, CurriculumCourse
from .serializers import (
    CourseSerializer, EnrollmentSerializer, DepartmentSerializer, SemesterSerializer,
    CurriculumSerializer, CurriculumCourseSerializer
)
from accounts.permissions import IsAdminUserRole
from notifications.services import (
    trigger_course_assignment_email,
    create_in_app_notification,
    log_audit_action
)
from notifications.models import Notification

class AppStatusView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        return Response({"status": "healthy", "app": "courses"})


class CoursePagination(PageNumberPagination):
    page_size = 5
    page_size_query_param = 'page_size'
    max_page_size = 100


class CourseViewSet(viewsets.ModelViewSet):
    serializer_class = CourseSerializer
    pagination_class = CoursePagination
    filter_backends = [filters.SearchFilter]
    search_fields = ['course_code', 'course_name', 'teacher__name']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUserRole()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Course.objects.none()

        role = getattr(user, 'role', 'STUDENT')
        if role == 'ADMIN' or user.is_superuser or user.is_staff:
            return Course.objects.all().select_related('teacher').order_by('-id')
        elif role == 'TEACHER':
            from teachers.models import Teacher
            try:
                teacher = Teacher.objects.get(email=user.email)
                return Course.objects.filter(teacher=teacher).select_related('teacher').order_by('-id')
            except Exception:
                return Course.objects.none()
        elif role == 'STUDENT':
            from students.models import Student
            from grades.models import Grade
            try:
                student = Student.objects.get(email=user.email)
                course_ids = Grade.objects.filter(student=student).values_list('course_id', flat=True)
                return Course.objects.filter(id__in=course_ids).select_related('teacher').order_by('-id')
            except Exception:
                return Course.objects.none()
        return Course.objects.none()

    def perform_create(self, serializer):
        course = serializer.save()
        
        # If teacher is assigned, trigger welcome assignment notification & email
        if course.teacher:
            User = get_user_model()
            user = User.objects.filter(email=course.teacher.email).first()
            if user:
                create_in_app_notification(
                    user=user,
                    title="New Course Assigned",
                    message=f"You have been assigned to teach course '{course.course_name}' ({course.course_code}).",
                    type=Notification.TypeChoices.COURSE_ASSIGNED
                )
            
            trigger_course_assignment_email(course.teacher, course)
            
            log_audit_action(
                user=self.request.user,
                action="Course Assigned",
                module="COURSES",
                description=f"Course '{course.course_name}' ({course.course_code}) created and assigned to teacher '{course.teacher.name}'."
            )
        else:
            log_audit_action(
                user=self.request.user,
                action="Course Created",
                module="COURSES",
                description=f"Course '{course.course_name}' ({course.course_code}) created without assigned teacher."
            )

    def perform_update(self, serializer):
        old_course = self.get_object()
        old_teacher = old_course.teacher
        
        course = serializer.save()
        new_teacher = course.teacher
        
        # Check if the teacher has changed
        if old_teacher != new_teacher:
            User = get_user_model()
            
            # Notify old teacher if removed
            if old_teacher:
                old_user = User.objects.filter(email=old_teacher.email).first()
                if old_user:
                    create_in_app_notification(
                        user=old_user,
                        title="Course Removed",
                        message=f"You have been unassigned from teaching course '{course.course_name}' ({course.course_code}).",
                        type=Notification.TypeChoices.COURSE_REMOVED
                    )
                log_audit_action(
                    user=self.request.user,
                    action="Course Removed",
                    module="COURSES",
                    description=f"Teacher '{old_teacher.name}' unassigned from course '{course.course_name}' ({course.course_code})."
                )
            
            # Notify new teacher if assigned
            if new_teacher:
                new_user = User.objects.filter(email=new_teacher.email).first()
                if new_user:
                    create_in_app_notification(
                        user=new_user,
                        title="New Course Assigned",
                        message=f"You have been assigned to teach course '{course.course_name}' ({course.course_code}).",
                        type=Notification.TypeChoices.COURSE_ASSIGNED
                    )
                trigger_course_assignment_email(new_teacher, course)
                log_audit_action(
                    user=self.request.user,
                    action="Course Assigned",
                    module="COURSES",
                    description=f"Teacher '{new_teacher.name}' assigned to course '{course.course_name}' ({course.course_code})."
                )
        else:
            # General course details update
            log_audit_action(
                user=self.request.user,
                action="Course Updated",
                module="COURSES",
                description=f"Course '{course.course_name}' ({course.course_code}) details updated."
            )

    def perform_destroy(self, instance):
        course_name = instance.course_name
        course_code = instance.course_code
        teacher = instance.teacher
        
        if teacher:
            User = get_user_model()
            user = User.objects.filter(email=teacher.email).first()
            if user:
                create_in_app_notification(
                    user=user,
                    title="Course Removed",
                    message=f"Course '{course_name}' ({course_code}) was deleted.",
                    type=Notification.TypeChoices.COURSE_REMOVED
                )
            log_audit_action(
                user=self.request.user,
                action="Course Removed",
                module="COURSES",
                description=f"Course '{course_name}' ({course_code}) deleted. Teacher '{teacher.name}' unassigned."
            )
        else:
            log_audit_action(
                user=self.request.user,
                action="Course Deleted",
                module="COURSES",
                description=f"Course '{course_name}' ({course_code}) deleted."
            )
            
        instance.delete()


class EnrollmentViewSet(viewsets.ModelViewSet):
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['student__full_name', 'student__roll_no', 'course__course_name', 'course__course_code']

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Enrollment.objects.none()
        
        role = getattr(user, 'role', 'STUDENT')
        if role == 'ADMIN' or user.is_superuser or user.is_staff:
            return Enrollment.objects.all().select_related('student', 'course', 'assigned_by').order_by('-id')
        elif role == 'TEACHER':
            return Enrollment.objects.filter(course__teacher__email=user.email).select_related('student', 'course', 'assigned_by').order_by('-id')
        elif role == 'STUDENT':
            return Enrollment.objects.filter(student__email=user.email).select_related('student', 'course', 'assigned_by').order_by('-id')
        return Enrollment.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        role = getattr(user, 'role', 'STUDENT')
        if role == 'STUDENT':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Students cannot enroll users into courses.")
        
        if role == 'TEACHER':
            course = serializer.validated_data['course']
            if course.teacher is None or course.teacher.email != user.email:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Teachers can only enroll students into their own courses.")
        
        serializer.save(enrollment_type='MANUAL', assigned_by=user)

    @action(detail=False, methods=['post'], permission_classes=[IsAdminUserRole])
    def replace(self, request):
        from students.models import Student
        from django.db import transaction
        
        student_id = request.data.get('student')
        old_course_id = request.data.get('old_course')
        new_course_id = request.data.get('new_course')
        
        if not student_id or not old_course_id or not new_course_id:
            return Response(
                {"detail": "student, old_course, and new_course are required fields."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            student = Student.objects.get(id=student_id)
            old_course = Course.objects.get(id=old_course_id)
            new_course = Course.objects.get(id=new_course_id)
        except (Student.DoesNotExist, Course.DoesNotExist):
            return Response({"detail": "Student or Course not found."}, status=status.HTTP_404_NOT_FOUND)
        
        if int(old_course_id) == int(new_course_id):
            return Response({"detail": "Old course and new course cannot be the same."}, status=status.HTTP_400_BAD_REQUEST)

        # Check if new enrollment already exists
        if Enrollment.objects.filter(student=student, course=new_course).exists():
            return Response({"detail": "Student is already enrolled in the new course."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if old enrollment exists
        old_enrollment = Enrollment.objects.filter(student=student, course=old_course).first()
        if not old_enrollment:
            return Response({"detail": "Student is not enrolled in the old course."}, status=status.HTTP_404_NOT_FOUND)
        
        with transaction.atomic():
            old_enrollment.delete()
            Enrollment.objects.create(
                student=student,
                course=new_course,
                enrollment_type='MANUAL',
                assigned_by=request.user
            )
            
        return Response({"status": "success", "detail": "Course replaced successfully."}, status=status.HTTP_200_OK)



class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all().order_by('name')
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUserRole()]
        return [IsAuthenticated()]


class SemesterViewSet(viewsets.ModelViewSet):
    queryset = Semester.objects.all().order_by('name')
    serializer_class = SemesterSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUserRole()]
        return [IsAuthenticated()]


class CurriculumViewSet(viewsets.ModelViewSet):
    queryset = Curriculum.objects.all().prefetch_related('curriculum_courses__course', 'department', 'semester').order_by('department__name', 'semester__number')
    serializer_class = CurriculumSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUserRole()]
        return [IsAuthenticated()]


class CurriculumCourseViewSet(viewsets.ModelViewSet):
    queryset = CurriculumCourse.objects.all().select_related('curriculum', 'course').order_by('id')
    serializer_class = CurriculumCourseSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUserRole()]
        return [IsAuthenticated()]


