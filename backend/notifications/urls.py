from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    NotificationViewSet,
    AdminSettingsView,
    EmailLogViewSet,
    AuditLogViewSet,
    SimulateLeaveNotificationView,
    NotificationUserListView
)

router = DefaultRouter()
router.register(r'logs/email', EmailLogViewSet, basename='emaillogs')
router.register(r'logs/audit', AuditLogViewSet, basename='auditlogs')
router.register(r'', NotificationViewSet, basename='notifications')

urlpatterns = [
    path('admin-settings/', AdminSettingsView.as_view(), name='admin_settings'),
    path('simulate-leave/', SimulateLeaveNotificationView.as_view(), name='simulate_leave'),
    path('users/', NotificationUserListView.as_view(), name='notification_users'),
    path('', include(router.urls)),
]

