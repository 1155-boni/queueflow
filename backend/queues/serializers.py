from rest_framework import serializers
from .models import ServicePoint, QueueEntry
from accounts.models import User


class ServicePointSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServicePoint
        fields = ('id', 'name', 'description', 'location', 'is_active', 'created_at')
        read_only_fields = ('created_at',)


class QueueEntrySerializer(serializers.ModelSerializer):
    service_point = ServicePointSerializer(read_only=True)
    user = serializers.StringRelatedField()  # Just username

    class Meta:
        model = QueueEntry
        fields = ('id', 'service_point', 'user', 'position', 'status', 'joined_at', 'called_at', 'estimated_wait_time')
        read_only_fields = ('position', 'status', 'joined_at', 'called_at', 'estimated_wait_time')


class JoinQueueSerializer(serializers.Serializer):
    service_point_id = serializers.IntegerField()
