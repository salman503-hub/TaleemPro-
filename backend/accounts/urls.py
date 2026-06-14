from django.urls import path
from .views import (
    AppStatusView,
    RegisterView,
    LogoutView,
    CurrentUserView,
    DashboardStatsView,
    UserPreferencesView,
    ChangePasswordForceView,
)

urlpatterns = [
    path('status/', AppStatusView.as_view(), name='accounts_status'),
    path('register/', RegisterView.as_view(), name='register'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('me/', CurrentUserView.as_view(), name='current_user'),
    path('dashboard-stats/', DashboardStatsView.as_view(), name='dashboard_stats'),
    path('preferences/', UserPreferencesView.as_view(), name='user_preferences'),
    path('change-password-force/', ChangePasswordForceView.as_view(), name='change_password_force'),
]
