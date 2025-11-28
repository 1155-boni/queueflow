from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from .models import QueueEntry, Notification
from .utils import send_queue_notification_email


@shared_task
def send_queue_update(service_point_id):
    """
    Task to send queue update notifications to joined users only.
    """
    from channels.layers import get_channel_layer
    from asgiref.sync import async_to_sync
    from django.core.cache import cache
    from .models import QueueEntry

    try:
        channel_layer = get_channel_layer()

        # Get joined users (joined, waiting or called)
        joined_entries = QueueEntry.objects.filter(
            service_point_id=service_point_id,
            status__in=['joined', 'waiting', 'called']
        ).select_related('user')

        # Send position updates to each joined user individually
        for entry in joined_entries:
            cache_key = f'queue_channel_{service_point_id}_{entry.user.id}'
            channel_name = cache.get(cache_key)
            if channel_name:
                async_to_sync(channel_layer.send)(
                    channel_name,
                    {
                        'type': 'queue_update',
                        'data': {
                            'position': entry.position,
                            'service_point_id': service_point_id
                        }
                    }
                )
    except Exception as e:
        # Log the error but don't fail the task
        print(f"Error sending queue update: {e}")


@shared_task
def send_wait_time_notifications():
    """
    Periodic task to send notifications based on estimated wait time.
    """
    now = timezone.now()

    # Send notifications for 15 minutes remaining
    fifteen_min_entries = QueueEntry.objects.filter(
        status='waiting',
        estimated_wait_time__lte=timedelta(minutes=15),
        estimated_wait_time__gt=timedelta(minutes=10)
    ).exclude(
        # Don't send if already sent in last hour
        user__notification__message__icontains='15 minutes',
        user__notification__created_at__gte=now - timedelta(hours=1)
    ).select_related('user')

    for entry in fifteen_min_entries:
        Notification.objects.create(
            user=entry.user,
            message='You will be called in approximately 15 minutes.'
        )
        send_queue_notification_email(
            entry.user.email,
            'You will be called in approximately 15 minutes.'
        )

    # Send notifications for 10 minutes remaining
    ten_min_entries = QueueEntry.objects.filter(
        status='waiting',
        estimated_wait_time__lte=timedelta(minutes=10),
        estimated_wait_time__gt=timedelta(minutes=5)
    ).exclude(
        # Don't send if already sent in last hour
        user__notification__message__icontains='10 minutes',
        user__notification__created_at__gte=now - timedelta(hours=1)
    ).select_related('user')

    for entry in ten_min_entries:
        Notification.objects.create(
            user=entry.user,
            message='You will be called in approximately 10 minutes.'
        )
        send_queue_notification_email(
            entry.user.email,
            'You will be called in approximately 10 minutes.'
        )

    # Send notifications for 5 minutes remaining
    five_min_entries = QueueEntry.objects.filter(
        status='waiting',
        estimated_wait_time__lte=timedelta(minutes=5),
        estimated_wait_time__gt=timedelta(minutes=0)
    ).exclude(
        # Don't send if already sent in last hour
        user__notification__message__icontains='5 minutes',
        user__notification__created_at__gte=now - timedelta(hours=1)
    ).select_related('user')

    for entry in five_min_entries:
        Notification.objects.create(
            user=entry.user,
            message='You will be called in approximately 5 minutes.'
        )
        send_queue_notification_email(
            entry.user.email,
            'You will be called in approximately 5 minutes.'
        )
