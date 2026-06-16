from django.urls import path
from .views import AppStatusView, StudentViewSet

student_list = StudentViewSet.as_view({
    'get': 'list',
    'post': 'create'
})

student_detail = StudentViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy'
})

urlpatterns = [
    path('status/', AppStatusView.as_view(), name='students_status'),
    path('', student_list, name='student-list'),
    path('<int:pk>/', student_detail, name='student-detail'),
    path('<int:pk>/toggle_active/', StudentViewSet.as_view({'post': 'toggle_active'}), name='student-toggle-active'),
]
