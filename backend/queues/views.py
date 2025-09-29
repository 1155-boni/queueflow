from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import ServicePoint, QueueEntry
from .serializers import ServicePointSerializer, QueueEntrySerializer, JoinQueueSerializer
from django.db.models import Q, Avg, F, Count
from django.utils import timezone
from datetime import timedelta
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


def send_queue_update(service_point_id):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'queue_{service_point_id}',
        {
            'type': 'queue_update',
            'data': {'message': 'Queue updated'}
        }
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_queue(request):
    """
    Allow authenticated user to join a queue at a service point.
    """
    serializer = JoinQueueSerializer(data=request.data)
    if serializer.is_valid():
        service_point_id = serializer.validated_data['service_point_id']
        service_point = ServicePoint.objects.filter(id=service_point_id, is_active=True).first()
        if not service_point:
            return Response({'error': 'Service point not found or inactive.'}, status=status.HTTP_404_NOT_FOUND)

        # Check if user is already in this queue
        if QueueEntry.objects.filter(service_point=service_point, user=request.user, status='waiting').exists():
            return Response({'error': 'You are already in this queue.'}, status=status.HTTP_400_BAD_REQUEST)

        # Get current waiting count
        waiting_count = QueueEntry.objects.filter(
            service_point=service_point,
            status__in=['waiting', 'called']
        ).count()

        # Create new entry
        queue_entry = QueueEntry.objects.create(
            service_point=service_point,
            user=request.user,
            position=waiting_count + 1,
            estimated_wait_time=timedelta(minutes=waiting_count * 5)  # Assume 5 minutes per person
        )

        send_queue_update(service_point_id)

        serializer = QueueEntrySerializer(queue_entry)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_queue_position(request):
    """
    Get the user's current queue position if any.
    """
    queue_entry = QueueEntry.objects.filter(
        user=request.user,
        status__in=['waiting', 'called']
    ).select_related('service_point').first()

    if queue_entry:
        serializer = QueueEntrySerializer(queue_entry)
        return Response(serializer.data)
    else:
        return Response({'message': 'No active queue position.'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def service_points(request):
    """
    List all active service points.
    """
    service_points = ServicePoint.objects.filter(is_active=True)
    serializer = ServicePointSerializer(service_points, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_service_point(request):
    """
    Staff can create a new service point.
    """
    if request.user.role != 'staff':
        return Response({'error': 'Only staff can create service points.'}, status=status.HTTP_403_FORBIDDEN)

    serializer = ServicePointSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_service_point(request, service_point_id):
    """
    Staff can delete a service point.
    """
    if request.user.role != 'staff':
        return Response({'error': 'Only staff can delete service points.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        service_point = ServicePoint.objects.get(id=service_point_id)
        service_point.delete()
        return Response({'message': 'Service point deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)
    except ServicePoint.DoesNotExist:
        return Response({'error': 'Service point not found.'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def call_next(request):
    """
    Staff calls the next person in the queue for a service point.
    """
    if request.user.role != 'staff':
        return Response({'error': 'Only staff can call next.'}, status=status.HTTP_403_FORBIDDEN)

    service_point_id = request.data.get('service_point_id')
    if not service_point_id:
        return Response({'error': 'service_point_id required.'}, status=status.HTTP_400_BAD_REQUEST)

    service_point = ServicePoint.objects.filter(id=service_point_id, is_active=True).first()
    if not service_point:
        return Response({'error': 'Service point not found.'}, status=status.HTTP_404_NOT_FOUND)

    # Find the next waiting entry
    next_entry = QueueEntry.objects.filter(
        service_point=service_point,
        status='waiting'
    ).order_by('position').first()

    if next_entry:
        next_entry.status = 'called'
        next_entry.called_at = timezone.now()
        next_entry.save()
        send_queue_update(service_point_id)
        serializer = QueueEntrySerializer(next_entry)
        return Response(serializer.data)
    else:
        return Response({'message': 'No one in queue.'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def leave_queue(request):
    """
    Allow user to leave the queue.
    """
    service_point_id = request.data.get('service_point_id')
    if not service_point_id:
        return Response({'error': 'service_point_id required.'}, status=status.HTTP_400_BAD_REQUEST)

    queue_entry = QueueEntry.objects.filter(
        service_point_id=service_point_id,
        user=request.user,
        status__in=['waiting', 'called']
    ).first()

    if queue_entry:
        queue_entry.status = 'left'
        queue_entry.save()
        # Update positions of others
        QueueEntry.objects.filter(
            service_point_id=service_point_id,
            position__gt=queue_entry.position,
            status='waiting'
        ).update(position=F('position') - 1)
        send_queue_update(service_point_id)
        return Response({'message': 'Left the queue.'})
    else:
        return Response({'error': 'Not in queue.'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics(request):
    """
    Get analytics for staff: average wait times, busiest hours, etc.
    """
    if request.user.role != 'staff':
        return Response({'error': 'Only staff can view analytics.'}, status=status.HTTP_403_FORBIDDEN)

    # Simple analytics
    total_entries = QueueEntry.objects.count()
    avg_wait_time = QueueEntry.objects.filter(called_at__isnull=False).aggregate(
        avg_wait=Avg(F('called_at') - F('joined_at'))
    )['avg_wait']

    # Busiest hours (simplified)
    busiest_hour = QueueEntry.objects.extra(
        select={'hour': 'extract(hour from joined_at)'}
    ).values('hour').annotate(count=Count('id')).order_by('-count').first()

    return Response({
        'total_entries': total_entries,
        'average_wait_time_seconds': avg_wait_time.total_seconds() if avg_wait_time else 0,
        'busiest_hour': busiest_hour['hour'] if busiest_hour else None,
    })
