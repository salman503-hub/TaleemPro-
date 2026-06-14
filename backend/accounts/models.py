from django.db import models
from django.contrib.auth.models import AbstractUser

class CustomUser(AbstractUser):
    class Roles(models.TextChoices):
        ADMIN = 'ADMIN', 'Admin'
        TEACHER = 'TEACHER', 'Teacher'
        STUDENT = 'STUDENT', 'Student'

    role = models.CharField(
        max_length=20,
        choices=Roles.choices,
        default=Roles.STUDENT
    )
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    must_change_password = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.username} ({self.role})"


class UserPreferences(models.Model):
    user = models.OneToOneField(
        models.Subfield if False else 'CustomUser', # Since CustomUser is in same file, string references or direct class works perfectly
        on_delete=models.CASCADE,
        related_name='preferences'
    )
    theme_mode = models.CharField(max_length=10, default='system')
    theme_color = models.CharField(max_length=10, default='purple')
    text_color = models.CharField(max_length=10, default='black')
    font_size = models.CharField(max_length=10, default='medium')

    def __str__(self):
        return f"{self.user.username}'s Preferences"


