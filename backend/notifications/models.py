from django.db import models
from django.conf import settings

class Notification(models.Model):
    class TypeChoices(models.TextChoices):
        WELCOME = 'WELCOME', 'Welcome Notification'
        COURSE_ASSIGNED = 'COURSE_ASSIGNED', 'New Course Assigned'
        COURSE_REMOVED = 'COURSE_REMOVED', 'Course Removed'
        PROFILE_UPDATED = 'PROFILE_UPDATED', 'Profile Updated'
        LEAVE_APPROVED = 'LEAVE_APPROVED', 'Leave Approved'
        LEAVE_REJECTED = 'LEAVE_REJECTED', 'Leave Rejected'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    type = models.CharField(max_length=30, choices=TypeChoices.choices)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.title} ({self.type})"


class EmailLog(models.Model):
    class StatusChoices(models.TextChoices):
        SENT = 'SENT', 'Sent'
        FAILED = 'FAILED', 'Failed'
        PENDING = 'PENDING', 'Pending'

    recipient_email = models.EmailField()
    subject = models.CharField(max_length=255)
    message = models.TextField()  # Typically HTML
    status = models.CharField(max_length=15, choices=StatusChoices.choices, default=StatusChoices.PENDING)
    sent_at = models.DateTimeField(auto_now_add=True)
    error_message = models.TextField(blank=True, null=True)
    notification_type = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return f"To: {self.recipient_email} | {self.subject} | Status: {self.status}"


class AuditLog(models.Model):
    class ModuleChoices(models.TextChoices):
        TEACHERS = 'TEACHERS', 'Teachers'
        COURSES = 'COURSES', 'Courses'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs'
    )
    action = models.CharField(max_length=100)  # e.g., "Teacher Created"
    module = models.CharField(max_length=50, choices=ModuleChoices.choices)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        actor = self.user.username if self.user else "System"
        return f"{actor} - {self.action} ({self.created_at})"


class NotificationSetting(models.Model):
    welcome_emails_enabled = models.BooleanField(default=True)
    course_assignment_emails_enabled = models.BooleanField(default=True)

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def get_settings(cls):
        obj, created = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return "Global Notification Settings"
