from django.urls import path
from .views import join_queue, my_queue_position, service_points

urlpatterns = [
    path('service-points/', service_points, name='service_points'),
    path('join/', join_queue, name='join_queue'),
    path('my-position/', my_queue_position, name='my_queue_position'),
]
