from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import viewsets, filters, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.decorators import action
from django.contrib.auth import get_user_model

from .models import Student
from .serializers import StudentSerializer
from accounts.permissions import IsAdminUserRole, IsAdminOrTeacherRole

class AppStatusView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        return Response({"status": "healthy", "app": "students"})


class StudentPagination(PageNumberPagination):
    page_size = 5
    page_size_query_param = 'page_size'
    max_page_size = 100


class StudentViewSet(viewsets.ModelViewSet):
    serializer_class = StudentSerializer
    pagination_class = StudentPagination
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'roll_no', 'email', 'department', 'semester']

    def get_permissions(self):
        if self.action in ['create']:
            return [IsAdminOrTeacherRole()]
        if self.action in ['update', 'partial_update', 'destroy', 'toggle_active']:
            return [IsAdminUserRole()]
        return [IsAdminOrTeacherRole()]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Student.objects.none()

        role = getattr(user, 'role', 'STUDENT')
        if role == 'ADMIN' or user.is_superuser or user.is_staff:
            return Student.objects.all().select_related('user').order_by('-id')
        elif role == 'TEACHER':
            from courses.models import Course, Enrollment
            from teachers.models import Teacher
            try:
                teacher = Teacher.objects.get(email=user.email)
                courses = Course.objects.filter(teacher=teacher)
                student_ids = Enrollment.objects.filter(course__in=courses).values_list('student_id', flat=True)
                return Student.objects.filter(id__in=student_ids).select_related('user').distinct().order_by('-id')
            except Exception:
                return Student.objects.none()
        elif role == 'STUDENT':
            return Student.objects.filter(email=user.email).select_related('user').order_by('-id')
        return Student.objects.none()

    def perform_create(self, serializer):
        # Read temporary password and assigned courses
        temp_password = self.request.data.get('password', 'Taleem@123')
        assigned_courses = self.request.data.get('assigned_courses', [])
        
        # Save student first
        student = serializer.save()
        
        User = get_user_model()
        # Find or create user account
        user = User.objects.filter(email=student.email).first()
        if not user:
            # Generate username: sanitize roll_no
            username = student.roll_no.lower().replace('-', '').replace(' ', '').replace('/', '')
            if User.objects.filter(username=username).exists():
                username = f"{username}_{student.id}"
            
            # Automatically create user profile preference
            user = User.objects.create_user(
                username=username,
                email=student.email,
                password=temp_password,
                role='STUDENT',
                must_change_password=True
            )
        
        # Link student to user
        student.user = user
        student.save()
        
        # Trigger Welcome In-app notification
        from notifications.services import create_in_app_notification
        from notifications.models import Notification
        
        create_in_app_notification(
            user=user,
            title="Welcome to TaleemPro!",
            message="Welcome to TaleemPro! Your student profile has been successfully set up. Please change your password on first login.",
            type=Notification.TypeChoices.WELCOME
        )
        
        # Assign courses
        if assigned_courses:
            from courses.models import Course, Enrollment
            for course_id in assigned_courses:
                try:
                    course = Course.objects.get(id=course_id)
                    Enrollment.objects.get_or_create(student=student, course=course)
                except Course.DoesNotExist:
                    pass

    def perform_destroy(self, instance):
        if instance.user:
            instance.user.delete()
        else:
            User = get_user_model()
            user = User.objects.filter(email=instance.email).first()
            if user:
                user.delete()
        instance.delete()

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        student = self.get_object()
        user = student.user
        if not user:
            User = get_user_model()
            user = User.objects.filter(email=student.email).first()
        
        if user:
            user.is_active = not user.is_active
            user.save()
            return Response({"status": "success", "is_active": user.is_active})
        else:
            return Response({"detail": "No user account linked to this student."}, status=status.HTTP_404_NOT_FOUND)



