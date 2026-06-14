from rest_framework import serializers
from .models import Teacher
from django.contrib.auth import get_user_model

class TeacherSerializer(serializers.ModelSerializer):
    is_active = serializers.SerializerMethodField()

    class Meta:
        model = Teacher
        fields = ['id', 'name', 'email', 'phone', 'department', 'designation', 'is_active']

    def get_is_active(self, obj):
        User = get_user_model()
        user = User.objects.filter(email=obj.email).first()
        return user.is_active if user else False

