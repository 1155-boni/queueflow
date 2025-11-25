import logging
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import ValidationError
from .serializers import RegisterSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import LoginSerializer
from queues.models import ServicePoint
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer



logger = logging.getLogger(__name__)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """
    Register a new user.
    """
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role,
                'organization_type': user.organization_type
            },
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CustomLoginView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = LoginSerializer

    def post(self, request, *args, **kwargs):
        ip_address = request.META.get('REMOTE_ADDR', 'unknown')
        user_agent = request.META.get('HTTP_USER_AGENT', 'unknown')
        method = request.method
        path = request.path

        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            user = serializer.user
            refresh = RefreshToken.for_user(user)
            access_token = refresh.access_token

            logger.info(f"Login successful - IP: {ip_address}, User-Agent: {user_agent}, Method: {method}, Path: {path}, Username: {user.username}")

            response = Response({
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'role': user.role,
                    'organization_type': user.organization_type
                }
            }, status=status.HTTP_200_OK)

            # Set HTTP-only cookies
            response.set_cookie(
                key='access_token',
                value=str(access_token),
                httponly=True,
                secure=False,  # Set to True in production with HTTPS
                samesite='Lax'
            )
            response.set_cookie(
                key='refresh_token',
                value=str(refresh),
                httponly=True,
                secure=False,  # Set to True in production with HTTPS
                samesite='Lax'
            )

            return response
        except ValidationError as e:
            logger.warning(f"Login failed - IP: {ip_address}, User-Agent: {user_agent}, Method: {method}, Path: {path}, Errors: {e.detail}")
            raise


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token(request):
    """
    Refresh access token using refresh token from cookies.
    """
    refresh_token_value = request.COOKIES.get('refresh_token')
    if not refresh_token_value:
        return Response({'error': 'Refresh token not found'}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        refresh = RefreshToken(refresh_token_value)
        access_token = refresh.access_token

        response = Response({'message': 'Token refreshed successfully'}, status=status.HTTP_200_OK)
        response.set_cookie(
            key='access_token',
            value=str(access_token),
            httponly=True,
            secure=False,  # Set to True in production with HTTPS
            samesite='Lax'
        )
        return response
    except Exception as e:
        return Response({'error': 'Invalid refresh token'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):
    """
    Get user profile information.
    """
    user = request.user
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'role': user.role,
        'organization_type': user.organization_type
    })


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def logout(request):
    """
    Logout user by clearing cookies.
    """
    response = Response({'message': 'Logged out successfully.'}, status=status.HTTP_200_OK)
    response.delete_cookie('access_token')
    response.delete_cookie('refresh_token')
    return response


@csrf_exempt
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_user(request):
    """
    Allow authenticated user to delete their own account.
    """
    user = request.user
    # Deactivate all service points owned by the user
    service_points = ServicePoint.objects.filter(creator=user)
    for sp in service_points:
        sp.is_active = False
        sp.save()
        # Notify connected clients
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'queue_{sp.id}',
            {
                'type': 'queue_update',
                'data': {'deleted': True}
            }
        )
    user.delete()
    return Response({'message': 'Account deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)
