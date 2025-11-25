from rest_framework import serializers
from .models import (
    ServicePoint, QueueEntry, Notification, ServiceType,
    Appointment, Feedback, Announcement, DocumentCheck,
    AuditLog, PriorityQueue
)
from accounts.models import User
from django.utils import timezone


class ServiceTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceType
        fields = ('id', 'name', 'description', 'estimated_duration', 'requires_documents', 'priority_level', 'is_active')


class ServicePointSerializer(serializers.ModelSerializer):
    queue_length = serializers.SerializerMethodField()
    service_types = ServiceTypeSerializer(many=True, read_only=True)

    class Meta:
        model = ServicePoint
        fields = (
            'id', 'name', 'description', 'location', 'map_url', 'is_active',
            'created_at', 'queue_length', 'organization_type', 'service_types',
            'supports_appointments', 'supports_priority', 'max_queue_length',
            'display_screen_url'
        )
        read_only_fields = ('created_at', 'queue_length')

    def get_queue_length(self, obj):
        return obj.queue_entries.filter(status__in=['waiting', 'called']).count()


class QueueEntrySerializer(serializers.ModelSerializer):
    service_point = ServicePointSerializer(read_only=True)
    user = serializers.StringRelatedField()  # Just username
    service_type = ServiceTypeSerializer(read_only=True)

    class Meta:
        model = QueueEntry
        fields = (
            'id', 'service_point', 'user', 'position', 'status', 'joined_at',
            'called_at', 'served_at', 'estimated_wait_time', 'service_type',
            'priority_level', 'appointment', 'ticket_number', 'qr_code', 'sms_sent'
        )
        read_only_fields = ('position', 'status', 'joined_at', 'called_at', 'served_at', 'estimated_wait_time', 'ticket_number', 'qr_code')


class JoinQueueSerializer(serializers.Serializer):
    service_point_id = serializers.IntegerField()
    service_type_id = serializers.IntegerField(required=False)
    priority_level = serializers.IntegerField(default=1, min_value=1, max_value=4)


class AppointmentSerializer(serializers.ModelSerializer):
    service_point = ServicePointSerializer(read_only=True)
    service_type = ServiceTypeSerializer(read_only=True)

    class Meta:
        model = Appointment
        fields = (
            'id', 'user', 'service_point', 'service_type', 'appointment_date',
            'appointment_time', 'status', 'notes', 'created_at', 'updated_at',
            'qr_code'
        )
        read_only_fields = ('created_at', 'updated_at', 'qr_code')

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = (
            'id', 'user', 'service_point', 'service_type', 'rating', 'comments',
            'wait_time_satisfaction', 'staff_service_rating', 'created_at', 'is_anonymous'
        )
        read_only_fields = ('created_at',)

    def create(self, validated_data):
        if validated_data.get('is_anonymous', False):
            validated_data['user'] = None
        else:
            validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class AnnouncementSerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Announcement
        fields = (
            'id', 'title', 'message', 'service_point', 'priority', 'is_active',
            'created_at', 'expires_at', 'created_by'
        )
        read_only_fields = ('created_at', 'created_by')


class DocumentCheckSerializer(serializers.ModelSerializer):
    reviewed_by = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = DocumentCheck
        fields = (
            'id', 'user', 'service_point', 'service_type', 'document_type',
            'status', 'notes', 'reviewed_by', 'reviewed_at', 'created_at', 'updated_at'
        )
        read_only_fields = ('reviewed_by', 'reviewed_at', 'created_at', 'updated_at')


class AuditLogSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = AuditLog
        fields = (
            'id', 'user', 'action', 'resource_type', 'resource_id', 'description',
            'ip_address', 'user_agent', 'timestamp', 'session_id'
        )
        read_only_fields = ('timestamp',)


class PriorityQueueSerializer(serializers.ModelSerializer):
    class Meta:
        model = PriorityQueue
        fields = (
            'id', 'service_point', 'name', 'priority_level', 'description',
            'is_active', 'max_capacity', 'created_at'
        )
        read_only_fields = ('created_at',)


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ('id', 'message', 'created_at', 'is_read')
        read_only_fields = ('id', 'created_at')


class CreateAppointmentSerializer(serializers.Serializer):
    service_point_id = serializers.IntegerField()
    service_type_id = serializers.IntegerField()
    appointment_date = serializers.DateField()
    appointment_time = serializers.TimeField()
    notes = serializers.CharField(required=False, allow_blank=True)


class QRCodeSerializer(serializers.Serializer):
    data = serializers.CharField()
    size = serializers.IntegerField(default=200, min_value=100, max_value=500)
