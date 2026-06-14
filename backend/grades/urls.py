from django.urls import path
from .views import AppStatusView, GradeViewSet, StudentResultSummaryView

grade_list = GradeViewSet.as_view({
    'get': 'list',
    'post': 'create'
})

grade_detail = GradeViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy'
})

urlpatterns = [
    path('status/', AppStatusView.as_view(), name='grades_status'),
    path('', grade_list, name='grade-list'),
    path('<int:pk>/', grade_detail, name='grade-detail'),
    path('student-results/', StudentResultSummaryView.as_view(), name='student_results'),
]
