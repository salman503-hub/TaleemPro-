from rest_framework import serializers
from .models import Course, Enrollment, Department, Semester, Curriculum, CurriculumCourse
from teachers.models import Teacher
from teachers.serializers import TeacherSerializer
from students.models import Student
from students.serializers import StudentSerializer

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name']


class SemesterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Semester
        fields = ['id', 'name', 'number']


class CourseSerializer(serializers.ModelSerializer):
    teacher = serializers.PrimaryKeyRelatedField(
        queryset=Teacher.objects.all(),
        required=False,
        allow_null=True
    )
    teacher_details = TeacherSerializer(source='teacher', read_only=True)

    class Meta:
        model = Course
        fields = ['id', 'course_code', 'course_name', 'credit_hours', 'teacher', 'teacher_details']


class CurriculumCourseSerializer(serializers.ModelSerializer):
    course_details = CourseSerializer(source='course', read_only=True)

    class Meta:
        model = CurriculumCourse
        fields = ['id', 'curriculum', 'course', 'course_details']


class CurriculumSerializer(serializers.ModelSerializer):
    department_details = DepartmentSerializer(source='department', read_only=True)
    semester_details = SemesterSerializer(source='semester', read_only=True)
    courses = CurriculumCourseSerializer(source='curriculum_courses', many=True, read_only=True)

    class Meta:
        model = Curriculum
        fields = ['id', 'department', 'department_details', 'semester', 'semester_details', 'courses']


class EnrollmentSerializer(serializers.ModelSerializer):
    student = serializers.PrimaryKeyRelatedField(queryset=Student.objects.all())
    course = serializers.PrimaryKeyRelatedField(queryset=Course.objects.all())
    student_details = StudentSerializer(source='student', read_only=True)
    course_details = CourseSerializer(source='course', read_only=True)
    created_at = serializers.DateTimeField(source='enrolled_at', read_only=True)
    assigned_by_username = serializers.CharField(source='assigned_by.username', read_only=True, allow_null=True)

    class Meta:
        model = Enrollment
        fields = [
            'id', 'student', 'course', 'enrollment_type', 'assigned_by',
            'assigned_by_username', 'created_at', 'enrolled_at',
            'student_details', 'course_details'
        ]
        read_only_fields = ['id', 'enrollment_type', 'assigned_by', 'enrolled_at', 'created_at']



