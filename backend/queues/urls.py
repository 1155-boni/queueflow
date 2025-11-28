from django.urls import path
from .views import join_queue, my_queue_position, service_points, create_service_point, delete_service_point, delete_all_service_points, call_next, analytics, leave_queue, notifications, mark_notification_read, delete_notification, dismiss_customer, public_service_points, my_queues

urlpatterns = [
    path('public-service-points/', public_service_points, name='public_service_points'),
    path('service-points/', service_points, name='service_points'),
    path('create-service-point/', create_service_point, name='create_service_point'),
    path('delete-service-point/<int:service_point_id>/', delete_service_point, name='delete_service_point'),
    path('delete-all-service-points/', delete_all_service_points, name='delete_all_service_points'),
    path('join/', join_queue, name='join_queue'),
    path('leave/', leave_queue, name='leave_queue'),
    path('my-position/', my_queue_position, name='my_queue_position'),
    path('call-next/', call_next, name='call_next'),
    path('dismiss-customer/', dismiss_customer, name='dismiss_customer'),
    path('analytics/', analytics, name='analytics'),
    path('notifications/', notifications, name='notifications'),
    path('notifications/<int:notification_id>/mark-read/', mark_notification_read, name='mark_notification_read'),
    path('notifications/<int:notification_id>/delete/', delete_notification, name='delete_notification'),
    path('my-queues/', my_queues, name='my_queues'),
]
