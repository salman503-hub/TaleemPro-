from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from django.db import transaction

from .models import Attendance
from .serializers import BulkAttendanceSerializer
from students.models import Student
from courses.models import Course

class AppStatusView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        return Response({"status": "healthy", "app": "attendance"})


class MarkAttendanceView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Enforce role checks
        role = getattr(request.user, 'role', 'STUDENT')
        if role not in ['ADMIN', 'TEACHER'] and not request.user.is_superuser:
            return Response({"detail": "You do not have permission to mark attendance."}, status=status.HTTP_403_FORBIDDEN)

        serializer = BulkAttendanceSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        course_id = serializer.validated_data['course']
        date = serializer.validated_data['date']
        records = serializer.validated_data['records']

        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response({"course": "Course not found."}, status=status.HTTP_400_BAD_REQUEST)

        # Enforce Teacher course ownership checks
        if role == 'TEACHER' and not request.user.is_superuser:
            from teachers.models import Teacher
            try:
                teacher = Teacher.objects.get(email=request.user.email)
                if course.teacher != teacher:
                    return Response({"detail": "You can only mark attendance for your own assigned courses."}, status=status.HTTP_403_FORBIDDEN)
            except Teacher.DoesNotExist:
                return Response({"detail": "Teacher profile not found."}, status=status.HTTP_400_BAD_REQUEST)

        created_count = 0
        updated_count = 0

        with transaction.atomic():
            for record in records:
                student_id = record['student']
                attendance_status = record['status']
                
                try:
                    student = Student.objects.get(id=student_id)
                except Student.DoesNotExist:
                    continue
                
                obj, created = Attendance.objects.update_or_create(
                    student=student,
                    course=course,
                    date=date,
                    defaults={'status': attendance_status}
                )
                if created:
                    created_count += 1
                else:
                    updated_count += 1

        return Response({
            "detail": "Attendance marked successfully.",
            "created": created_count,
            "updated": updated_count
        }, status=status.HTTP_200_OK)


class AttendanceReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = getattr(request.user, 'role', 'STUDENT')
        if role not in ['ADMIN', 'TEACHER'] and not request.user.is_superuser:
            return Response({"detail": "You do not have permission to view attendance reports."}, status=status.HTTP_403_FORBIDDEN)

        course_id = request.query_params.get('course')
        month = request.query_params.get('month')
        year = request.query_params.get('year')

        if not course_id or not month or not year:
            return Response({"detail": "course, month, and year query parameters are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            course = Course.objects.get(id=course_id)
            month = int(month)
            year = int(year)
        except (Course.DoesNotExist, ValueError):
            return Response({"detail": "Invalid course, month, or year parameters."}, status=status.HTTP_400_BAD_REQUEST)

        # Enforce Teacher course ownership checks
        if role == 'TEACHER' and not request.user.is_superuser:
            from teachers.models import Teacher
            try:
                teacher = Teacher.objects.get(email=request.user.email)
                if course.teacher != teacher:
                    return Response({"detail": "You can only view reports for your own assigned courses."}, status=status.HTTP_403_FORBIDDEN)
            except Teacher.DoesNotExist:
                return Response({"detail": "Teacher profile not found."}, status=status.HTTP_400_BAD_REQUEST)

        # Fetch all attendance records for this course, month, and year in a single query
        attendances = Attendance.objects.filter(
            course=course,
            date__month=month,
            date__year=year
        )

        # Group records by student ID in memory
        from collections import defaultdict
        att_by_student = defaultdict(list)
        for att in attendances:
            att_by_student[att.student_id].append(att.status)

        # Fetch only students enrolled in this course (via Grade) or all if admin
        if role == 'TEACHER' or role == 'ADMIN' or request.user.is_superuser:
            from grades.models import Grade
            student_ids = Grade.objects.filter(course=course).values_list('student_id', flat=True)
            students = Student.objects.filter(id__in=student_ids).order_by('roll_no')
        else:
            students = Student.objects.all().order_by('roll_no')

        report_data = []
        for student in students:
            statuses = att_by_student.get(student.id, [])
            presents = statuses.count(Attendance.StatusChoices.PRESENT)
            absents = statuses.count(Attendance.StatusChoices.ABSENT)
            leaves = statuses.count(Attendance.StatusChoices.LEAVE)
            total = len(statuses)

            percentage = 0.0
            if total > 0:
                percentage = round((presents / total) * 100, 1)

            report_data.append({
                "student_id": student.id,
                "roll_no": student.roll_no,
                "name": student.name,
                "present_count": presents,
                "absent_count": absents,
                "leave_count": leaves,
                "total_classes": total,
                "percentage": percentage
            })

        return Response(report_data, status=status.HTTP_200_OK)


class StudentAttendanceSummaryView(APIView):
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
                    return Response({"detail": "You can only view your own attendance summary."}, status=status.HTTP_403_FORBIDDEN)
            except Student.DoesNotExist:
                return Response({"detail": "Student profile not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            student = Student.objects.get(id=student_id)
        except Student.DoesNotExist:
            return Response({"detail": "Student not found."}, status=status.HTTP_404_NOT_FOUND)

        # Fetch all attendance records for this student in a single query
        attendances = Attendance.objects.filter(student=student)

        # Group records by course ID in memory
        from collections import defaultdict
        att_by_course = defaultdict(list)
        for att in attendances:
            att_by_course[att.course_id].append(att.status)

        courses = Course.objects.all().order_by('course_code')
        summary_data = []

        for course in courses:
            statuses = att_by_course.get(course.id, [])
            total = len(statuses)
            if total == 0:
                continue

            presents = statuses.count(Attendance.StatusChoices.PRESENT)
            absents = statuses.count(Attendance.StatusChoices.ABSENT)
            leaves = statuses.count(Attendance.StatusChoices.LEAVE)

            percentage = round((presents / total) * 100, 1)

            summary_data.append({
                "course_id": course.id,
                "course_code": course.course_code,
                "course_name": course.course_name,
                "present_count": presents,
                "absent_count": absents,
                "leave_count": leaves,
                "total_classes": total,
                "percentage": percentage
            })

        return Response(summary_data, status=status.HTTP_200_OK)

