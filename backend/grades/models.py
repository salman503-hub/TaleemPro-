from django.db import models
from students.models import Student
from courses.models import Course

class Grade(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='grades')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='grades')
    quiz_marks = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    mid_marks = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    final_marks = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    total_marks = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    grade = models.CharField(max_length=5, blank=True, null=True)

    class Meta:
        unique_together = ('student', 'course')

    def save(self, *args, **kwargs):
        # Calculate total
        self.total_marks = float(self.quiz_marks or 0) + float(self.mid_marks or 0) + float(self.final_marks or 0)
        
        # Calculate letter grade
        if self.total_marks >= 90:
            self.grade = 'A+'
        elif self.total_marks >= 80:
            self.grade = 'A'
        elif self.total_marks >= 70:
            self.grade = 'B'
        elif self.total_marks >= 60:
            self.grade = 'C'
        elif self.total_marks >= 50:
            self.grade = 'D'
        else:
            self.grade = 'F'
            
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student.name} - {self.course.course_code}: {self.grade}"
