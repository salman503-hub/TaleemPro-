from rest_framework.permissions import BasePermission

class IsAdminUserRole(BasePermission):
    """
    Allows access only to users with ADMIN role, superusers, or staff.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (getattr(request.user, 'role', None) == 'ADMIN' or request.user.is_superuser or request.user.is_staff)
        )

class IsTeacherUserRole(BasePermission):
    """
    Allows access only to users with TEACHER role.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            getattr(request.user, 'role', None) == 'TEACHER'
        )

class IsStudentUserRole(BasePermission):
    """
    Allows access only to users with STUDENT role.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            getattr(request.user, 'role', None) == 'STUDENT'
        )

class IsAdminOrTeacherRole(BasePermission):
    """
    Allows access to users with ADMIN or TEACHER role.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (getattr(request.user, 'role', None) in ['ADMIN', 'TEACHER'] or request.user.is_superuser or request.user.is_staff)
        )
