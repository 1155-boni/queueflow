from django.urls import path
from .views import register, CustomLoginView, logout, delete_user, refresh_token

urlpatterns = [
    path('register/', register, name='register'),
    path('login/', CustomLoginView.as_view(), name='login'),
    path('logout/', logout, name='logout'),
    path('refresh/', refresh_token, name='refresh_token'),
    path('delete-user/', delete_user, name='delete_user'),
]
