import os
import django
import sys
import traceback

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'taleempro.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory
from teachers.views import TeacherViewSet
from rest_framework.test import force_authenticate

def run_test():
    User = get_user_model()
    admin = User.objects.filter(role='ADMIN').first() or User.objects.filter(is_superuser=True).first()
    if not admin:
        print("Error: No admin user found.")
        return

    print(f"Authenticated as Admin User: {admin.username}")

    # Delete teacher if already exists to prevent integrity errors in test
    from teachers.models import Teacher
    email = 'new_teacher_test_email@example.com'
    Teacher.objects.filter(email=email).delete()
    User.objects.filter(email=email).delete()

    factory = APIRequestFactory()
    request = factory.post('/api/teachers/', {
        'name': 'New Test Teacher',
        'email': email,
        'phone': '03001111111',
        'department': 'Computer Science',
        'designation': 'Lecturer'
    }, format='json')
    
    force_authenticate(request, user=admin)
    view = TeacherViewSet.as_view({'post': 'create'})
    
    try:
        response = view(request)
        print("Response Status Code:", response.status_code)
        print("Response Data:", response.data)
    except Exception as e:
        print("Exception caught:")
        traceback.print_exc()

if __name__ == '__main__':
    run_test()
