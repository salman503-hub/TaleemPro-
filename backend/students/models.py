from django.db import models
from django.conf import settings

class StudentProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='student_profile'
    )
    student_id = models.CharField(max_length=20, unique=True, blank=True, null=True)
    grade_level = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return f"Student: {self.user.username}"


class Student(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='student',
        null=True,
        blank=True
    )
    roll_no = models.CharField(max_length=50, unique=True)
    full_name = models.CharField(max_length=150, db_column='name')
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    department = models.ForeignKey(
        'courses.Department',
        on_delete=models.PROTECT,
        related_name='students'
    )
    semester = models.ForeignKey(
        'courses.Semester',
        on_delete=models.PROTECT,
        related_name='students'
    )


    @property
    def name(self):
        return self.full_name

    @name.setter
    def name(self, value):
        self.full_name = value

    def __str__(self):
        return f"{self.full_name} ({self.roll_no})"


from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver

@receiver(pre_save, sender=Student)
def cache_old_student_fields(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_instance = Student.objects.get(pk=instance.pk)
            instance._old_semester = old_instance.semester
            instance._old_department = old_instance.department
        except Student.DoesNotExist:
            pass

@receiver(post_save, sender=Student)
def auto_enroll_student(sender, instance, created, **kwargs):
    semester_changed = getattr(instance, '_old_semester', None) != instance.semester
    department_changed = getattr(instance, '_old_department', None) != instance.department
    
    if created or semester_changed or department_changed:
        from courses.models import Curriculum, CurriculumCourse, Enrollment
        try:
            curriculum = Curriculum.objects.filter(
                department=instance.department,
                semester=instance.semester
            ).first()
            if curriculum:
                cur_courses = CurriculumCourse.objects.filter(curriculum=curriculum).select_related('course')
                for cur_course in cur_courses:
                    Enrollment.objects.get_or_create(
                        student=instance,
                        course=cur_course.course,
                        defaults={
                            'enrollment_type': 'CURRICULUM',
                            'assigned_by': None
                        }
                    )
        except Exception:
            pass



