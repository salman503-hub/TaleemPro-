from django.urls import path
from .views import (
    AppStatusView,
    MarkAttendanceView,
    AttendanceReportView,
    StudentAttendanceSummaryView,
)

urlpatterns = [
    path('status/', AppStatusView.as_view(), name='attendance_status'),
    path('mark/', MarkAttendanceView.as_view(), name='mark_attendance'),
    path('report/', AttendanceReportView.as_view(), name='attendance_report'),
    path('student-summary/', StudentAttendanceSummaryView.as_view(), name='student_summary'),
]
