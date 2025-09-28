from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import ServicePoint, QueueEntry
from .serializers import ServicePointSerializer, QueueEntrySerializer, JoinQueueSerializer
from django.db.models import Q


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
            estimated_wait_time=waiting_count * 5  # Assume 5 minutes per person
        )

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
