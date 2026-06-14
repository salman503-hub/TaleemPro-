from django.db import models
from django.conf import settings
from courses.models import Course

class Announcement(models.Model):
    class TypeChoices(models.TextChoices):
        GLOBAL = 'GLOBAL', 'Global'
        COURSE = 'COURSE', 'Course'

    title = models.CharField(max_length=200)
    content = models.TextField()
    announcement_type = models.CharField(
        max_length=20,
        choices=TypeChoices.choices,
        default=TypeChoices.GLOBAL
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='announcements'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='announcements'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.announcement_type})"
