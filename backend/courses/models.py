from django.db import models
from django.conf import settings
from teachers.models import Teacher
from students.models import Student

class Department(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class Semester(models.Model):
    name = models.CharField(max_length=50, unique=True)
    number = models.IntegerField(unique=True, null=True, blank=True)

    def __str__(self):
        return self.name


class Course(models.Model):
    course_code = models.CharField(max_length=50, unique=True)
    course_name = models.CharField(max_length=150)
    credit_hours = models.IntegerField()
    teacher = models.ForeignKey(
        Teacher,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='courses'
    )

    def __str__(self):
        return f"{self.course_code} - {self.course_name}"


class Curriculum(models.Model):
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='curriculums')
    semester = models.ForeignKey(Semester, on_delete=models.CASCADE, related_name='curriculums')

    class Meta:
        unique_together = ('department', 'semester')

    def __str__(self):
        return f"{self.department.name} - {self.semester.name} Curriculum"


class CurriculumCourse(models.Model):
    curriculum = models.ForeignKey(Curriculum, on_delete=models.CASCADE, related_name='curriculum_courses')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='curriculum_courses')

    class Meta:
        unique_together = ('curriculum', 'course')

    def __str__(self):
        return f"{self.curriculum.department.name} {self.curriculum.semester.name} : {self.course.course_code}"


class Enrollment(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='enrollments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    enrollment_type = models.CharField(
        max_length=15,
        choices=[('CURRICULUM', 'Curriculum'), ('MANUAL', 'Manual')],
        default='CURRICULUM'
    )
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_enrollments'
    )
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('student', 'course')

    def __str__(self):
        return f"{self.student.full_name} enrolled in {self.course.course_code} ({self.enrollment_type})"

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new:
            from grades.models import Grade
            # Create a default Grade if it doesn't already exist
            Grade.objects.get_or_create(
                student=self.student,
                course=self.course,
                defaults={
                    'quiz_marks': 0.0,
                    'mid_marks': 0.0,
                    'final_marks': 0.0,
                }
            )

    def delete(self, *args, **kwargs):
        student = self.student
        course = self.course
        from grades.models import Grade
        Grade.objects.filter(student=student, course=course).delete()
        from attendance.models import Attendance
        Attendance.objects.filter(student=student, course=course).delete()
        super().delete(*args, **kwargs)


