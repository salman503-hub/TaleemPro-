from django.urls import path
from .views import AppStatusView, TeacherViewSet

teacher_list = TeacherViewSet.as_view({
    'get': 'list',
    'post': 'create'
})

teacher_detail = TeacherViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy'
})

urlpatterns = [
    path('status/', AppStatusView.as_view(), name='teachers_status'),
    path('', teacher_list, name='teacher-list'),
    path('<int:pk>/', teacher_detail, name='teacher-detail'),
]
