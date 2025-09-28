from django.urls import path
from .views import join_queue, my_queue_position, service_points, create_service_point, call_next, analytics, leave_queue

urlpatterns = [
    path('service-points/', service_points, name='service_points'),
    path('create-service-point/', create_service_point, name='create_service_point'),
    path('join/', join_queue, name='join_queue'),
    path('leave/', leave_queue, name='leave_queue'),
    path('my-position/', my_queue_position, name='my_queue_position'),
    path('call-next/', call_next, name='call_next'),
    path('analytics/', analytics, name='analytics'),
]
