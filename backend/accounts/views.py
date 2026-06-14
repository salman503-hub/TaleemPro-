from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model

from .serializers import (
    UserSerializer,
    RegisterSerializer,
    MyTokenObtainPairSerializer,
)

User = get_user_model()

class AppStatusView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        return Response({"status": "healthy", "app": "accounts"})


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                "user": UserSerializer(user).data,
                "message": "User registered successfully."
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"detail": "Invalid or missing refresh token."}, status=status.HTTP_400_BAD_REQUEST)


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


from students.models import Student
from teachers.models import Teacher
from courses.models import Course, Enrollment
from grades.models import Grade
from attendance.models import Attendance
from notifications.models import Notification, EmailLog
from django.utils import timezone

from django.db import models
from django.db.models import Count

class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = request.user.role
        email = request.user.email
        
        # Admin Stats
        if role == 'ADMIN':
            student_count = Student.objects.count()
            teacher_count = Teacher.objects.count()
            course_count = Course.objects.count()
            grade_count = Grade.objects.count()
            
            # Enrollment Type counts
            auto_enrollments = Enrollment.objects.filter(enrollment_type='CURRICULUM').count()
            manual_enrollments = Enrollment.objects.filter(enrollment_type='MANUAL').count()
            
            # Notifications & Email Stats
            total_notifs = Notification.objects.filter(user=request.user).count()
            unread_notifs = Notification.objects.filter(user=request.user, is_read=False).count()
            emails_sent_today = EmailLog.objects.filter(sent_at__date=timezone.now().date(), status='SENT').count()
            failed_emails = EmailLog.objects.filter(status='FAILED').count()
            
            # Department Breakdown Chart Data
            dept_counts = Student.objects.values('department__name').annotate(count=Count('id')).order_by('-count')
            dept_chart = [{"label": item['department__name'] or "Unassigned", "value": item['count']} for item in dept_counts]
            
            return Response({
                "role": "ADMIN",
                "stats": [
                    {"label": "Total Students", "value": student_count, "color": "primary"},
                    {"label": "Faculty Members", "value": teacher_count, "color": "success"},
                    {"label": "Courses Offered", "value": course_count, "color": "info"},
                    {"label": "Graded Records", "value": grade_count, "color": "warning"},
                    {"label": "Curriculum Enrollments", "value": auto_enrollments, "color": "secondary"},
                    {"label": "Manual Enrollments", "value": manual_enrollments, "color": "purple"},
                    {"label": "Total Notifications", "value": total_notifs, "color": "primary"},
                    {"label": "Unread Notifications", "value": unread_notifs, "color": "danger"},
                    {"label": "Emails Sent Today", "value": emails_sent_today, "color": "success"},
                    {"label": "Failed Emails", "value": failed_emails, "color": "warning"}
                ],
                "charts": {
                    "departments": dept_chart
                }
            })
            
        # Teacher Stats
        elif role == 'TEACHER':
            try:
                teacher = Teacher.objects.get(email=email)
                courses = Course.objects.filter(teacher=teacher)
                course_count = courses.count()
                
                attendance_count = Attendance.objects.filter(course__in=courses).count()
                graded_count = Grade.objects.filter(course__in=courses).count()
                
                total_notifs = Notification.objects.filter(user=request.user).count()
                unread_notifs = Notification.objects.filter(user=request.user, is_read=False).count()
                
                # Course Breakdown Stats for Charts
                course_chart = []
                for c in courses:
                    c_att = Attendance.objects.filter(course=c).count()
                    c_grd = Grade.objects.filter(course=c).count()
                    course_chart.append({
                        "course_code": c.course_code,
                        "course_name": c.course_name,
                        "attendance_count": c_att,
                        "grade_count": c_grd
                    })
                
                return Response({
                    "role": "TEACHER",
                    "teacher_name": teacher.name,
                    "stats": [
                        {"label": "My Courses", "value": course_count, "color": "primary"},
                        {"label": "Attendance Marked", "value": attendance_count, "color": "success"},
                        {"label": "Graded Assignments", "value": graded_count, "color": "warning"},
                        {"label": "Total Notifications", "value": total_notifs, "color": "secondary"},
                        {"label": "Unread Notifications", "value": unread_notifs, "color": "danger"}
                    ],
                    "charts": {
                        "courses": course_chart
                    }
                })
            except Teacher.DoesNotExist:
                total_notifs = Notification.objects.filter(user=request.user).count()
                unread_notifs = Notification.objects.filter(user=request.user, is_read=False).count()
                return Response({
                    "role": "TEACHER",
                    "stats": [
                        {"label": "My Courses", "value": 0, "color": "primary"},
                        {"label": "Total Notifications", "value": total_notifs, "color": "secondary"},
                        {"label": "Unread Notifications", "value": unread_notifs, "color": "danger"},
                        {"label": "Warning", "value": "Profile not linked", "color": "danger"}
                    ],
                    "charts": {
                        "courses": []
                    }
                })
                
        # Student Stats
        elif role == 'STUDENT':
            try:
                student = Student.objects.get(email=email)
                
                # Fetch GPA
                student_grades = Grade.objects.filter(student=student)
                grade_points_map = {'A+': 4.0, 'A': 4.0, 'B': 3.0, 'C': 2.0, 'D': 1.0, 'F': 0.0}
                total_credits = sum(g.course.credit_hours for g in student_grades)
                weighted_sum = sum(grade_points_map.get(g.grade, 0.0) * g.course.credit_hours for g in student_grades)
                gpa = round(weighted_sum / total_credits, 2) if total_credits > 0 else 0.0
                
                # Fetch Attendance
                attendances = Attendance.objects.filter(student=student)
                total_att = attendances.count()
                presents = attendances.filter(status='PRESENT').count()
                attendance_percentage = round((presents / total_att) * 100, 1) if total_att > 0 else 0.0
                
                # Get enrollments directly
                student_enrollments = Enrollment.objects.filter(student=student).select_related('course')
                course_count = student_enrollments.count()
                
                total_notifs = Notification.objects.filter(user=request.user).count()
                unread_notifs = Notification.objects.filter(user=request.user, is_read=False).count()
                
                # Enrolled Course Chart Details
                course_chart = []
                for enroll in student_enrollments:
                    c = enroll.course
                    g = student_grades.filter(course=c).first()
                    grade_val = g.grade if g else "N/A"
                    total_marks = g.total_marks if g else None
                    
                    att_c = attendances.filter(course=c)
                    att_total = att_c.count()
                    att_pres = att_c.filter(status='PRESENT').count()
                    att_pct = round((att_pres / att_total) * 100, 1) if att_total > 0 else 0.0
                    
                    course_chart.append({
                        "course_code": c.course_code,
                        "course_name": c.course_name,
                        "grade": grade_val,
                        "total_marks": total_marks,
                        "attendance_percentage": att_pct,
                        "assignment_type": enroll.enrollment_type
                    })
                
                return Response({
                    "role": "STUDENT",
                    "student_name": student.name,
                    "stats": [
                        {"label": "Cumulative GPA", "value": gpa, "color": "success"},
                        {"label": "Overall Attendance", "value": f"{attendance_percentage}%", "color": "info"},
                        {"label": "Enrolled Courses", "value": course_count, "color": "primary"},
                        {"label": "Total Notifications", "value": total_notifs, "color": "secondary"},
                        {"label": "Unread Notifications", "value": unread_notifs, "color": "danger"}
                    ],
                    "charts": {
                        "courses": course_chart
                    }
                })
            except Student.DoesNotExist:
                total_notifs = Notification.objects.filter(user=request.user).count()
                unread_notifs = Notification.objects.filter(user=request.user, is_read=False).count()
                return Response({
                    "role": "STUDENT",
                    "stats": [
                        {"label": "Cumulative GPA", "value": "0.0", "color": "success"},
                        {"label": "Enrolled Courses", "value": 0, "color": "primary"},
                        {"label": "Total Notifications", "value": total_notifs, "color": "secondary"},
                        {"label": "Unread Notifications", "value": unread_notifs, "color": "danger"},
                        {"label": "Warning", "value": "Profile not linked", "color": "danger"}
                    ],
                    "charts": {
                        "courses": []
                    }
                })
                
        return Response({"detail": "Role not recognized."}, status=status.HTTP_400_BAD_REQUEST)


from .models import UserPreferences
from .serializers import UserPreferencesSerializer

class UserPreferencesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        prefs, created = UserPreferences.objects.get_or_create(user=request.user)
        serializer = UserPreferencesSerializer(prefs)
        return Response(serializer.data)

    def put(self, request):
        prefs, created = UserPreferences.objects.get_or_create(user=request.user)
        serializer = UserPreferencesSerializer(prefs, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordForceView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        new_password = request.data.get('new_password')
        
        if not new_password:
            return Response({"detail": "New password is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(new_password)
        user.must_change_password = False
        user.save()
        
        return Response({"detail": "Password updated successfully."}, status=status.HTTP_200_OK)

