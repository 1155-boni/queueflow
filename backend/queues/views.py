from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.db.models import F, Avg, Count, Max, ExpressionWrapper, DurationField
from django.db.models.functions import ExtractHour
from datetime import timedelta
from .models import QueueEntry, Notification, ServicePoint
from .serializers import ServicePointSerializer, QueueEntrySerializer, JoinQueueSerializer, NotificationSerializer
from .tasks import send_queue_notification_email, send_queue_update

@api_view(['GET'])
@permission_classes([AllowAny])
def public_service_points(request):
    """
    List all active service points for public view (landing page).
    """
    service_points = ServicePoint.objects.filter(is_active=True)
    serializer = ServicePointSerializer(service_points, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def dismiss_customer(request):
    """
    Staff can dismiss/serve a customer who has been called.
    """
    if request.user.role != 'staff':
        return Response({'error': 'Only staff can dismiss customers.'}, status=status.HTTP_403_FORBIDDEN)

    queue_entry_id = request.data.get('queue_entry_id')
    if not queue_entry_id:
        return Response({'error': 'queue_entry_id required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        queue_entry = QueueEntry.objects.get(
            id=queue_entry_id,
            status='called'  # Only dismiss customers who have been called
        )

        # Check if staff owns the service point
        if queue_entry.service_point.creator != request.user:
            return Response({'error': 'You can only dismiss customers from your service points.'}, status=status.HTTP_403_FORBIDDEN)

        # Mark as served
        queue_entry.status = 'served'
        queue_entry.served_at = timezone.now()
        queue_entry.save()

        # Update positions of remaining customers
        QueueEntry.objects.filter(
            service_point=queue_entry.service_point,
            position__gt=queue_entry.position,
            status='waiting'
        ).update(position=F('position') - 1)

        # Send notification to the dismissed customer
        Notification.objects.create(
            user=queue_entry.user,
            message='Your service has been completed. Thank you for your patience!'
        )

        # Send email notification
        send_queue_notification_email(
            queue_entry.user.email,
            'Your service has been completed. Thank you for your patience!'
        )

        send_queue_update(queue_entry.service_point.id)

        return Response({'message': f'Customer {queue_entry.user.username} has been dismissed.'})

    except QueueEntry.DoesNotExist:
        return Response({'error': 'Queue entry not found or customer not in called status.'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_queue(request):
    """
    Allow users to join a queue for a service point.
    """
    serializer = JoinQueueSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    service_point_id = serializer.validated_data['service_point_id']

    try:
        service_point = ServicePoint.objects.get(id=service_point_id, is_active=True)
    except ServicePoint.DoesNotExist:
        return Response({'error': 'Service point not found or inactive.'}, status=status.HTTP_404_NOT_FOUND)

    # Check if user is already in any queue
    existing_entry = QueueEntry.objects.filter(
        user=request.user,
        status__in=['joined', 'waiting', 'called']
    ).first()
    if existing_entry:
        return Response({'error': 'You are already in a queue.'}, status=status.HTTP_400_BAD_REQUEST)

    # Get the next position
    last_position = QueueEntry.objects.filter(
        service_point=service_point,
        status__in=['waiting', 'called']
    ).aggregate(max_pos=Max('position'))['max_pos'] or 0

    position = last_position + 1

    # Create queue entry
    queue_entry = QueueEntry.objects.create(
        service_point=service_point,
        user=request.user,
        position=position
    )

    # Send notification
    Notification.objects.create(
        user=request.user,
        message=f'You have joined the queue for {service_point.name}. Your position is {position}.'
    )

    send_queue_notification_email(
        request.user.email,
        f'You have joined the queue for {service_point.name}. Your position is {position}.'
    )

    send_queue_update(service_point.id)

    return Response({
        'message': f'Successfully joined queue for {service_point.name}.',
        'position': position
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_queue_position(request):
    """
    Return user's current position in queue.
    """
    queue_entry = QueueEntry.objects.filter(
        user=request.user,
        status__in=['joined', 'waiting', 'called']
    ).order_by('-joined_at').first()
    if not queue_entry:
        return Response({'error': 'You are not in any queue.'}, status=status.HTTP_404_NOT_FOUND)
    serializer = QueueEntrySerializer(queue_entry)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def service_points(request):
    """
    List active service points. Staff see only their own, users see all.
    """
    if request.user.role == 'staff':
        service_points = ServicePoint.objects.filter(is_active=True, creator=request.user)
    else:
        service_points = ServicePoint.objects.filter(is_active=True)
    serializer = ServicePointSerializer(service_points, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_service_point(request):
    """
    Staff can create service points.
    """
    if request.user.role != 'staff':
        return Response({'error': 'Only staff can create service points.'}, status=status.HTTP_403_FORBIDDEN)

    serializer = ServicePointSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(creator=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_service_point(request, service_point_id):
    """
    Staff can delete their own service points, regardless of queue status.
    """
    if request.user.role != 'staff':
        return Response({'error': 'Only staff can delete service points.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        service_point = ServicePoint.objects.get(id=service_point_id, creator=request.user)
    except ServicePoint.DoesNotExist:
        return Response({'error': 'Service point not found or you do not own it.'}, status=status.HTTP_404_NOT_FOUND)

    # Mark all active queue entries as abandoned before deleting
    QueueEntry.objects.filter(
        service_point=service_point,
        status__in=['joined', 'waiting', 'called']
    ).update(status='abandoned')

    # Send notifications to users in the queue
    active_entries = QueueEntry.objects.filter(service_point=service_point, status='abandoned')
    for entry in active_entries:
        Notification.objects.create(
            user=entry.user,
            message=f'The service point {service_point.name} has been closed. Your queue entry has been cancelled.'
        )
        send_queue_notification_email(
            entry.user.email,
            f'The service point {service_point.name} has been closed. Your queue entry has been cancelled.'
        )

    service_point.delete()
    return Response({'message': 'Service point deleted successfully.'})


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_all_service_points(request):
    """
    Staff can delete all their service points, regardless of queue status.
    """
    if request.user.role != 'staff':
        return Response({'error': 'Only staff can delete service points.'}, status=status.HTTP_403_FORBIDDEN)

    deleted_count, _ = ServicePoint.objects.filter(creator=request.user).delete()
    return Response({'message': f'Successfully deleted {deleted_count} service points.'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def call_next(request):
    """
    Staff call next customer in queue.
    """
    if request.user.role != 'staff':
        return Response({'error': 'Only staff can call next customer.'}, status=status.HTTP_403_FORBIDDEN)

    # Find the next waiting customer for any of the staff's service points
    try:
        queue_entry = QueueEntry.objects.filter(
            service_point__creator=request.user,
            status='joined'
        ).order_by('position').first()

        if not queue_entry:
            return Response({'error': 'No customers waiting in your queues.'}, status=status.HTTP_404_NOT_FOUND)

        # Mark as called
        queue_entry.status = 'called'
        queue_entry.called_at = timezone.now()
        queue_entry.save()

        # Send notification
        Notification.objects.create(
            user=queue_entry.user,
            message=f'Your turn! Please proceed to {queue_entry.service_point.name}.'
        )

        send_queue_notification_email(
            queue_entry.user.email,
            f'Your turn! Please proceed to {queue_entry.service_point.name}.'
        )

        send_queue_update(queue_entry.service_point.id)

        serializer = QueueEntrySerializer(queue_entry)
        return Response(serializer.data)

    except QueueEntry.DoesNotExist:
        return Response({'error': 'No customers waiting.'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics(request):
    """
    Provide queue analytics.
    """
    if request.user.role != 'staff':
        return Response({'error': 'Only staff can view analytics.'}, status=status.HTTP_403_FORBIDDEN)

    # Get analytics for staff's service points
    service_points = ServicePoint.objects.filter(creator=request.user)

    # Total queues (all entries)
    total_queues = QueueEntry.objects.filter(service_point__in=service_points).count()

    # Average wait time in minutes
    avg_wait_time_delta = QueueEntry.objects.filter(
        service_point__in=service_points,
        status='served',
        served_at__isnull=False
    ).aggregate(
        avg_wait=Avg(F('served_at') - F('joined_at'))
    )['avg_wait']
    average_wait_time = round(avg_wait_time_delta.total_seconds() / 60, 2) if avg_wait_time_delta else 0

    # Busiest hour
    busiest_hour_data = QueueEntry.objects.filter(
        service_point__in=service_points
    ).annotate(hour=ExtractHour('joined_at')).values('hour').annotate(count=Count('id')).order_by('-count').first()
    busiest_hour = busiest_hour_data['hour'] if busiest_hour_data else None

    # Abandoned queues
    abandoned_queues = QueueEntry.objects.filter(
        service_point__in=service_points,
        status='abandoned'
    ).count()

    return Response({
        'total_queues': total_queues,
        'average_wait_time': f"{average_wait_time} minutes",
        'busiest_hour': busiest_hour,
        'abandoned_queues': abandoned_queues
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def leave_queue(request):
    """
    Allow users to leave a specific queue.
    """
    queue_entry_id = request.data.get('queue_entry_id')

    if queue_entry_id:
        # Leave specific queue
        try:
            queue_entry = QueueEntry.objects.get(
                id=queue_entry_id,
                user=request.user,
                status__in=['joined', 'waiting', 'called']
            )
        except QueueEntry.DoesNotExist:
            return Response({'error': 'Queue entry not found or you do not own it.'}, status=status.HTTP_404_NOT_FOUND)
    else:
        # Leave current active queue (backward compatibility)
        queue_entry = QueueEntry.objects.filter(
            user=request.user,
            status__in=['joined', 'waiting', 'called']
        ).order_by('-joined_at').first()
        if not queue_entry:
            return Response({'error': 'You are not in any queue.'}, status=status.HTTP_404_NOT_FOUND)

    # Mark as abandoned
    queue_entry.status = 'abandoned'
    queue_entry.save()

    # Update positions of remaining customers
    QueueEntry.objects.filter(
        service_point=queue_entry.service_point,
        position__gt=queue_entry.position,
        status__in=['waiting', 'called']
    ).update(position=F('position') - 1)

    send_queue_update(queue_entry.service_point.id)

    return Response({'message': 'Successfully left the queue.'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notifications(request):
    """
    Get user's notifications.
    """
    notifications = Notification.objects.filter(user=request.user)
    serializer = NotificationSerializer(notifications, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, notification_id):
    """
    Mark notification as read.
    """
    try:
        notification = Notification.objects.get(id=notification_id, user=request.user)
        notification.is_read = True
        notification.save()
        return Response({'message': 'Notification marked as read.'})
    except Notification.DoesNotExist:
        return Response({'error': 'Notification not found.'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_notification(request, notification_id):
    """
    Delete a notification.
    """
    try:
        notification = Notification.objects.get(id=notification_id, user=request.user)
        notification.delete()
        return Response({'message': 'Notification deleted successfully.'})
    except Notification.DoesNotExist:
        return Response({'error': 'Notification not found.'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_queues(request):
    """
    Get all queue entries for the user (historical and active).
    """
    queue_entries = QueueEntry.objects.filter(user=request.user).order_by('-joined_at')
    serializer = QueueEntrySerializer(queue_entries, many=True)
    return Response(serializer.data)
