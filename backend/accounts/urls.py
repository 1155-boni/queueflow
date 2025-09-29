from django.urls import path
from .views import register, CustomLoginView, delete_user

urlpatterns = [
    path('register/', register, name='register'),
    path('login/', CustomLoginView.as_view(), name='login'),
    path('delete-user/', delete_user, name='delete_user'),
]
