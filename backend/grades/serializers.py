from rest_framework import serializers
from .models import Grade
from students.models import Student
from courses.models import Course
from students.serializers import StudentSerializer
from courses.serializers import CourseSerializer

class GradeSerializer(serializers.ModelSerializer):
    student = serializers.PrimaryKeyRelatedField(queryset=Student.objects.all())
    course = serializers.PrimaryKeyRelatedField(queryset=Course.objects.all())
    student_details = StudentSerializer(source='student', read_only=True)
    course_details = CourseSerializer(source='course', read_only=True)

    class Meta:
        model = Grade
        fields = [
            'id', 'student', 'course', 
            'student_details', 'course_details',
            'quiz_marks', 'mid_marks', 'final_marks', 
            'total_marks', 'grade'
        ]
        read_only_fields = ['total_marks', 'grade']
