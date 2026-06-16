from rest_framework import viewsets, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.utils import timezone

from .models import Notification, EmailLog, AuditLog, NotificationSetting
from .serializers import (
    NotificationSerializer,
    EmailLogSerializer,
    AuditLogSerializer,
    NotificationSettingSerializer
)
from accounts.permissions import IsAdminUserRole
from .services import resend_failed_email, create_in_app_notification

User = get_user_model()

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Users can only see their own notifications
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        # Auto-associate the notification with the creating user (for normal creation if ever needed)
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({"unread_count": count})

    @action(detail=True, methods=['post'], url_path='mark-read')
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({"status": "success", "detail": "Notification marked as read."})

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({"status": "success", "detail": "All notifications marked as read."})


class AdminSettingsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get(self, request):
        settings_obj = NotificationSetting.get_settings()
        serializer = NotificationSettingSerializer(settings_obj)
        return Response(serializer.data)

    def put(self, request):
        settings_obj = NotificationSetting.get_settings()
        serializer = NotificationSettingSerializer(settings_obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EmailLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = EmailLog.objects.all().order_by('-sent_at')
    serializer_class = EmailLogSerializer
    permission_classes = [IsAuthenticated, IsAdminUserRole]
    filter_backends = [filters.SearchFilter]
    search_fields = ['recipient_email', 'subject', 'status']

    @action(detail=True, methods=['post'])
    def resend(self, request, pk=None):
        email_log = self.get_object()
        resend_failed_email(email_log)
        return Response({"status": "success", "detail": "Email resend job triggered in background."})


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all().order_by('-created_at')
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, IsAdminUserRole]
    filter_backends = [filters.SearchFilter]
    search_fields = ['action', 'module', 'description', 'user__username']


class SimulateLeaveNotificationView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def post(self, request):
        user_id = request.data.get('user_id')
        leave_status = request.data.get('status')  # 'APPROVED' or 'REJECTED'

        if not user_id or not leave_status:
            return Response(
                {"detail": "Both 'user_id' and 'status' are required fields."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if leave_status not in ['APPROVED', 'REJECTED']:
            return Response(
                {"detail": "Status must be either 'APPROVED' or 'REJECTED'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        target_user = get_object_or_404(User, id=user_id)
        
        if leave_status == 'APPROVED':
            title = "Leave Request Approved"
            msg = "Your leave request has been approved by the administrator."
            notif_type = Notification.TypeChoices.LEAVE_APPROVED
        else:
            title = "Leave Request Rejected"
            msg = "Your leave request has been rejected by the administrator. Contact HR for details."
            notif_type = Notification.TypeChoices.LEAVE_REJECTED

        create_in_app_notification(
            user=target_user,
            title=title,
            message=msg,
            type=notif_type
        )

        return Response({
            "status": "success",
            "detail": f"Leave {leave_status.lower()} in-app notification sent to {target_user.username}."
        })


class NotificationUserListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get(self, request):
        users = User.objects.all().values('id', 'username', 'email', 'role')
        return Response(users)


from rest_framework.permissions import AllowAny

class DebugEmailLogsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        import socket
        connection_status = {}
        try:
            # Test SMTP port 587
            s = socket.create_connection(("smtp.gmail.com", 587), timeout=5)
            s.close()
            connection_status["smtp_587_ok"] = True
        except Exception as e:
            connection_status["smtp_587_ok"] = False
            connection_status["smtp_587_error"] = str(e)

        try:
            # Test SMTP port 465 just in case
            s = socket.create_connection(("smtp.gmail.com", 465), timeout=5)
            s.close()
            connection_status["smtp_465_ok"] = True
        except Exception as e:
            connection_status["smtp_465_ok"] = False
            connection_status["smtp_465_error"] = str(e)

        logs = EmailLog.objects.all().order_by('-id')[:10]
        logs_data = [
            {
                "id": log.id,
                "recipient": log.recipient_email,
                "status": log.status,
                "error": log.error_message,
                "sent_at": log.sent_at
            }
            for log in logs
        ]
        
        return Response({
            "connection_status": connection_status,
            "logs": logs_data
        })

