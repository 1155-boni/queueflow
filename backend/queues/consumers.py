import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.core.cache import cache
from .serializers import QueueEntrySerializer, ServicePointSerializer
from .models import QueueEntry, ServicePoint


class QueueConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.service_point_id = self.scope['url_route']['kwargs']['service_point_id']
        self.service_point_group_name = f'queue_{self.service_point_id}'

        # Join room group
        await self.channel_layer.group_add(
            self.service_point_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.service_point_group_name,
            self.channel_name
        )

        # Remove channel name from cache
        if hasattr(self, 'user') and self.user.is_authenticated:
            cache_key = f'queue_channel_{self.service_point_id}_{self.user.id}'
            cache.delete(cache_key)

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']

        # Send message to room group
        await self.channel_layer.group_send(
            self.service_point_group_name,
            {
                'type': 'queue_message',
                'message': message
            }
        )

    async def queue_message(self, event):
        message = event['message']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': message
        }))

    async def queue_update(self, event):
        # Broadcast queue updates
        await self.send(text_data=json.dumps(event))

    async def notification(self, event):
        # Broadcast notification to all connected clients in the group
        await self.send(text_data=json.dumps(event['data']))
