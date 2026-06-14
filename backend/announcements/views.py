from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from django.db.models import Q

from .models import Announcement
from .serializers import AnnouncementSerializer
from courses.models import Course
from teachers.models import Teacher
from students.models import Student
from grades.models import Grade
from accounts.permissions import IsAdminOrTeacherRole

class AnnouncementViewSet(viewsets.ModelViewSet):
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'content', 'course__course_code']

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Announcement.objects.none()

        role = getattr(user, 'role', 'STUDENT')
        if role == 'ADMIN' or user.is_superuser or user.is_staff:
            return Announcement.objects.all().select_related('course', 'created_by').order_by('-id')
        
        elif role == 'TEACHER':
            try:
                teacher = Teacher.objects.get(email=user.email)
                courses = Course.objects.filter(teacher=teacher)
                return Announcement.objects.filter(
                    Q(announcement_type=Announcement.TypeChoices.GLOBAL) |
                    Q(announcement_type=Announcement.TypeChoices.COURSE, course__in=courses)
                ).distinct().select_related('course', 'created_by').order_by('-id')
            except Teacher.DoesNotExist:
                return Announcement.objects.filter(announcement_type=Announcement.TypeChoices.GLOBAL).select_related('course', 'created_by').order_by('-id')
        
        elif role == 'STUDENT':
            try:
                student = Student.objects.get(email=user.email)
                course_ids = Grade.objects.filter(student=student).values_list('course_id', flat=True)
                return Announcement.objects.filter(
                    Q(announcement_type=Announcement.TypeChoices.GLOBAL) |
                    Q(announcement_type=Announcement.TypeChoices.COURSE, course_id__in=course_ids)
                ).distinct().select_related('course', 'created_by').order_by('-id')
            except Student.DoesNotExist:
                return Announcement.objects.filter(announcement_type=Announcement.TypeChoices.GLOBAL).select_related('course', 'created_by').order_by('-id')

        return Announcement.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        role = getattr(user, 'role', 'STUDENT')
        
        if role == 'STUDENT' and not user.is_superuser:
            raise PermissionDenied("Students are not allowed to create announcements.")
            
        announcement_type = serializer.validated_data.get('announcement_type', Announcement.TypeChoices.GLOBAL)
        course = serializer.validated_data.get('course', None)
        
        if role == 'TEACHER' and not user.is_superuser:
            if announcement_type != Announcement.TypeChoices.COURSE:
                raise PermissionDenied("Teachers can only create course-specific announcements.")
            if not course:
                raise PermissionDenied("A course must be specified for course-specific announcements.")
            try:
                teacher = Teacher.objects.get(email=user.email)
                if course.teacher != teacher:
                    raise PermissionDenied("You can only create announcements for your own assigned courses.")
            except Teacher.DoesNotExist:
                raise PermissionDenied("Teacher profile not linked to user account.")
                
        serializer.save(created_by=user)

    def perform_update(self, serializer):
        user = self.request.user
        role = getattr(user, 'role', 'STUDENT')
        
        if role == 'STUDENT' and not user.is_superuser:
            raise PermissionDenied("Students are not allowed to update announcements.")
            
        announcement = self.get_object()
        # Admin can update any. Creator of announcement can update.
        if role != 'ADMIN' and announcement.created_by != user and not user.is_superuser:
            raise PermissionDenied("You do not have permission to edit this announcement.")
            
        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        role = getattr(user, 'role', 'STUDENT')
        
        if role == 'STUDENT' and not user.is_superuser:
            raise PermissionDenied("Students are not allowed to delete announcements.")
            
        if role != 'ADMIN' and instance.created_by != user and not user.is_superuser:
            raise PermissionDenied("You do not have permission to delete this announcement.")
            
        instance.delete()
