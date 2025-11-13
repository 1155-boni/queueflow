from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/queues/(?P<service_point_id>\w+)/$', consumers.QueueConsumer.as_asgi()),
]
