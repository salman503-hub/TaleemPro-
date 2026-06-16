from django.urls import path
from django.http import JsonResponse
from .views import AppStatusView, TeacherViewSet

# Root test response
def home(request):
    return JsonResponse({"message": "Backend is working 🚀"})


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
    # Teachers APIs
    path('', teacher_list, name='teacher-list'),
    path('<int:pk>/', teacher_detail, name='teacher-detail'),
    path('<int:pk>/toggle_active/', TeacherViewSet.as_view({'post': 'toggle_active'}), name='teacher-toggle-active'),

    # API status / test
    path('status/', AppStatusView.as_view(), name='teachers_status'),
    path('test/', home, name='teachers_test'),
]
