from rest_framework import serializers
from .models import ServicePoint, QueueEntry, Notification
from accounts.models import User


class ServicePointSerializer(serializers.ModelSerializer):
    queue_length = serializers.SerializerMethodField()

    class Meta:
        model = ServicePoint
        fields = ('id', 'name', 'description', 'location', 'is_active', 'created_at', 'creator', 'queue_length')
        read_only_fields = ('created_at', 'creator', 'queue_length')

    def validate_location(self, value):
        if not value:
            raise serializers.ValidationError("Location is required.")
        return value

    def get_queue_length(self, obj):
        return obj.queue_entries.filter(status__in=['waiting', 'called']).count()


class QueueEntrySerializer(serializers.ModelSerializer):
    service_point = ServicePointSerializer(read_only=True)
    user = serializers.StringRelatedField()  # Just username

    class Meta:
        model = QueueEntry
        fields = ('id', 'service_point', 'user', 'position', 'status', 'joined_at', 'called_at', 'estimated_wait_time')
        read_only_fields = ('position', 'status', 'joined_at', 'called_at', 'estimated_wait_time')


class JoinQueueSerializer(serializers.Serializer):
    service_point_id = serializers.IntegerField()


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ('id', 'message', 'created_at', 'is_read')
        read_only_fields = ('id', 'created_at')
