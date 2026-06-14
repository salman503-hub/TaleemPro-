from rest_framework import serializers
from .models import Attendance
from students.models import Student
from courses.models import Course

class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = ['id', 'student', 'course', 'date', 'status']


class BulkAttendanceRecordSerializer(serializers.Serializer):
    student = serializers.IntegerField()
    status = serializers.ChoiceField(choices=Attendance.StatusChoices.choices)


class BulkAttendanceSerializer(serializers.Serializer):
    course = serializers.IntegerField()
    date = serializers.DateField()
    records = BulkAttendanceRecordSerializer(many=True)
