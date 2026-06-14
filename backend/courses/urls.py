from django.urls import path
from .views import (
    AppStatusView, CourseViewSet, EnrollmentViewSet, DepartmentViewSet, SemesterViewSet,
    CurriculumViewSet, CurriculumCourseViewSet
)

course_list = CourseViewSet.as_view({
    'get': 'list',
    'post': 'create'
})

course_detail = CourseViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy'
})

enrollment_list = EnrollmentViewSet.as_view({
    'get': 'list',
    'post': 'create'
})

enrollment_detail = EnrollmentViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy'
})

dept_list = DepartmentViewSet.as_view({
    'get': 'list',
    'post': 'create'
})

dept_detail = DepartmentViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy'
})

sem_list = SemesterViewSet.as_view({
    'get': 'list',
    'post': 'create'
})

sem_detail = SemesterViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy'
})

curriculum_list = CurriculumViewSet.as_view({
    'get': 'list',
    'post': 'create'
})

curriculum_detail = CurriculumViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy'
})

curriculum_course_list = CurriculumCourseViewSet.as_view({
    'get': 'list',
    'post': 'create'
})

curriculum_course_detail = CurriculumCourseViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy'
})

urlpatterns = [
    path('status/', AppStatusView.as_view(), name='courses_status'),
    path('', course_list, name='course-list'),
    path('<int:pk>/', course_detail, name='course-detail'),
    path('enrollments/', enrollment_list, name='enrollment-list'),
    path('enrollments/<int:pk>/', enrollment_detail, name='enrollment-detail'),
    path('departments/', dept_list, name='department-list'),
    path('departments/<int:pk>/', dept_detail, name='department-detail'),
    path('semesters/', sem_list, name='semester-list'),
    path('semesters/<int:pk>/', sem_detail, name='semester-detail'),
    path('curriculums/', curriculum_list, name='curriculum-list'),
    path('curriculums/<int:pk>/', curriculum_detail, name='curriculum-detail'),
    path('curriculum-courses/', curriculum_course_list, name='curriculum-course-list'),
    path('curriculum-courses/<int:pk>/', curriculum_course_detail, name='curriculum-course-detail'),
]
