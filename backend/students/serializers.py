from rest_framework import serializers
from .models import Student
from django.contrib.auth import get_user_model
from courses.models import Department, Semester

class StudentSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='full_name')
    is_active = serializers.SerializerMethodField()
    department = serializers.PrimaryKeyRelatedField(queryset=Department.objects.all())
    semester = serializers.PrimaryKeyRelatedField(queryset=Semester.objects.all())

    class Meta:
        model = Student
        fields = ['id', 'roll_no', 'name', 'email', 'phone', 'department', 'semester', 'is_active']

    def get_is_active(self, obj):
        if obj.user:
            return obj.user.is_active
        User = get_user_model()
        user = User.objects.filter(email=obj.email).first()
        if user:
            return user.is_active
        return False

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['department'] = instance.department.name if instance.department else ''
        data['semester'] = instance.semester.name if instance.semester else ''
        data['department_id'] = instance.department.id if instance.department else None
        data['semester_id'] = instance.semester.id if instance.semester else None
        return data



