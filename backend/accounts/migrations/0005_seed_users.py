from django.db import migrations

def seed_users(apps, schema_editor):
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    # 1. Admin
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='admin123',
            role='ADMIN'
        )
    else:
        # Update password if already exists
        admin = User.objects.get(username='admin')
        admin.set_password('admin123')
        admin.role = 'ADMIN'
        admin.save()
        
    # 2. Teacher
    if not User.objects.filter(username='teacher_haris').exists():
        User.objects.create_user(
            username='teacher_haris',
            email='haris@example.com',
            password='teacher123',
            role='TEACHER'
        )
    else:
        teacher = User.objects.get(username='teacher_haris')
        teacher.set_password('teacher123')
        teacher.role = 'TEACHER'
        teacher.save()
        
    # 3. Student
    if not User.objects.filter(username='bsf24003920').exists():
        User.objects.create_user(
            username='bsf24003920',
            email='salmanghafoor503@gmail.com',
            password='student123',
            role='STUDENT'
        )
    else:
        student = User.objects.get(username='bsf24003920')
        student.set_password('student123')
        student.role = 'STUDENT'
        student.save()

def rollback_users(apps, schema_editor):
    from django.contrib.auth import get_user_model
    User = get_user_model()
    User.objects.filter(username__in=['admin', 'teacher_haris', 'bsf24003920']).delete()

class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0004_customuser_must_change_password'),
    ]

    operations = [
        migrations.RunPython(seed_users, rollback_users),
    ]
