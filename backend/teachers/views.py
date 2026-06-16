from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import viewsets, filters, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.decorators import action
from django.contrib.auth import get_user_model
from django.utils.crypto import get_random_string

from .models import Teacher
from .serializers import TeacherSerializer
from accounts.permissions import IsAdminUserRole, IsAdminOrTeacherRole
from notifications.services import (
    trigger_welcome_email,
    create_in_app_notification,
    log_audit_action
)
from notifications.models import Notification

class AppStatusView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        return Response({"status": "healthy", "app": "teachers"})


class TeacherPagination(PageNumberPagination):
    page_size = 5
    page_size_query_param = 'page_size'
    max_page_size = 100


class TeacherViewSet(viewsets.ModelViewSet):
    serializer_class = TeacherSerializer
    pagination_class = TeacherPagination
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'email', 'department', 'designation']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'toggle_active']:
            return [IsAdminUserRole()]
        return [IsAdminOrTeacherRole()]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Teacher.objects.none()

        role = getattr(user, 'role', 'STUDENT')
        if role == 'ADMIN' or user.is_superuser or user.is_staff:
            return Teacher.objects.all().order_by('-id')
        elif role == 'TEACHER':
            return Teacher.objects.filter(email=user.email)
        elif role == 'STUDENT':
            from courses.models import Course
            from grades.models import Grade
            from students.models import Student
            try:
                student = Student.objects.get(email=user.email)
                course_ids = Grade.objects.filter(student=student).values_list('course_id', flat=True)
                teacher_ids = Course.objects.filter(id__in=course_ids).values_list('teacher_id', flat=True)
                return Teacher.objects.filter(id__in=teacher_ids).distinct().order_by('-id')
            except Exception:
                return Teacher.objects.none()
        return Teacher.objects.none()

    def perform_create(self, serializer):
        from django.db import transaction
        with transaction.atomic():
            teacher = serializer.save()
            User = get_user_model()
            
            # Generate temporary random password
            temp_password = get_random_string(length=10)
            
            username = teacher.email.split('@')[0].lower().replace('.', '').replace('_', '')
            if User.objects.filter(username=username).exists():
                username = f"{username}_{teacher.id}"
            
            # Create User with random password and must_change_password=True
            user = User.objects.create_user(
                username=username,
                email=teacher.email,
                password=temp_password,
                role='TEACHER',
                must_change_password=True
            )

            # Trigger Welcome Email asynchronously
            trigger_welcome_email(teacher.name, teacher.email, username, temp_password)

            # Create Welcome in-app notification
            create_in_app_notification(
                user=user,
                title="Welcome to TaleemPro!",
                message="Welcome to TaleemPro! Your profile has been successfully set up. Please change your password on first login.",
                type=Notification.TypeChoices.WELCOME
            )

            # Log admin audit action
            log_audit_action(
                user=self.request.user,
                action="Teacher Created",
                module="TEACHERS",
                description=f"Teacher '{teacher.name}' ({teacher.email}) added and linked user account created."
            )

    def perform_update(self, serializer):
        teacher = serializer.save()
        
        # Trigger In-App profile updated notification
        User = get_user_model()
        user = User.objects.filter(email=teacher.email).first()
        if user:
            create_in_app_notification(
                user=user,
                title="Profile Updated",
                message="Your teacher profile information has been updated by the administrator.",
                type=Notification.TypeChoices.PROFILE_UPDATED
            )
            
        # Log admin audit action
        log_audit_action(
            user=self.request.user,
            action="Teacher Updated",
            module="TEACHERS",
            description=f"Teacher '{teacher.name}' ({teacher.email}) profile updated."
        )

    def perform_destroy(self, instance):
        User = get_user_model()
        user = User.objects.filter(email=instance.email).first()
        if user:
            user.delete()
            
        teacher_name = instance.name
        teacher_email = instance.email
        instance.delete()
        
        # Log admin audit action
        log_audit_action(
            user=self.request.user,
            action="Teacher Deleted",
            module="TEACHERS",
            description=f"Teacher '{teacher_name}' ({teacher_email}) and linked user account deleted."
        )

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        teacher = self.get_object()
        User = get_user_model()
        user = User.objects.filter(email=teacher.email).first()
        if user:
            user.is_active = not user.is_active
            user.save()
            
            # Log admin audit action
            status_str = "Activated" if user.is_active else "Deactivated"
            log_audit_action(
                user=self.request.user,
                action="Teacher Updated",
                module="TEACHERS",
                description=f"Teacher '{teacher.name}' ({teacher.email}) user account status set to {status_str}."
            )
            
            return Response({"status": "success", "is_active": user.is_active})
        else:
            return Response({"detail": "No user account linked to this email address."}, status=status.HTTP_404_NOT_FOUND)



