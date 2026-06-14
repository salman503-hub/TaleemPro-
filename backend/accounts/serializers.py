from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from students.models import StudentProfile
from teachers.models import TeacherProfile

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'phone_number', 'must_change_password')
        read_only_fields = ('id',)


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    password_confirm = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    role = serializers.ChoiceField(choices=User.Roles.choices, required=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password_confirm', 'role', 'phone_number')

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        role = validated_data.get('role')
        phone_number = validated_data.get('phone_number', '')

        # Create CustomUser
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            role=role,
            phone_number=phone_number
        )

        # Automatically create corresponding role profile
        if role == User.Roles.STUDENT:
            StudentProfile.objects.create(user=user)
        elif role == User.Roles.TEACHER:
            TeacherProfile.objects.create(user=user)

        return user


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims into the token payload
        token['username'] = user.username
        token['email'] = user.email
        token['role'] = user.role
        token['must_change_password'] = user.must_change_password
        return token

    def validate(self, attrs):
        data = super().validate(attrs)

        # Also add custom user data to the standard HTTP JSON response
        data['username'] = self.user.username
        data['email'] = self.user.email
        data['role'] = self.user.role
        data['id'] = self.user.id
        data['must_change_password'] = self.user.must_change_password
        return data


from .models import UserPreferences

class UserPreferencesSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPreferences
        fields = ('theme_mode', 'theme_color', 'text_color', 'font_size')
