from django.urls import path
from .views import register, refresh_token, CustomLoginView, logout, delete_user, profile

urlpatterns = [
    path('register/', register, name='register'),
    path('refresh/', refresh_token, name='refresh_token'),
    path('login/', CustomLoginView.as_view(), name='login'),
    path('logout/', logout, name='logout'),
    path('profile/', profile, name='profile'),
    path('delete-user/', delete_user, name='delete_user'),
]
