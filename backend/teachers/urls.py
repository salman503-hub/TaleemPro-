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
    # Root URL (IMPORTANT)
    path('', home),

    # API status
    path('status/', AppStatusView.as_view(), name='teachers_status'),

    # Teachers APIs
    path('teachers/', teacher_list, name='teacher-list'),
    path('teachers/<int:pk>/', teacher_detail, name='teacher-detail'),
]
