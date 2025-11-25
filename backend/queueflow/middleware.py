import logging
from django.utils import timezone
from django.contrib.auth.models import AnonymousUser
from accounts.models import User
from queues.models import AuditLog

logger = logging.getLogger(__name__)


class AuditLogMiddleware:
    """
    Middleware to log user actions for security and compliance.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Log the request
        if hasattr(request, 'user') and not isinstance(request.user, AnonymousUser):
            action = f"{request.method} {request.path}"
            details = {
                'method': request.method,
                'path': request.path,
                'user_agent': request.META.get('HTTP_USER_AGENT', ''),
                'ip_address': self.get_client_ip(request),
                'query_params': dict(request.GET),
                'post_data': dict(request.POST) if request.method == 'POST' else {},
            }

            # Create audit log entry
            AuditLog.objects.create(
                user=request.user,
                action=action,
                details=str(details),
                timestamp=timezone.now(),
                ip_address=self.get_client_ip(request)
            )

        response = self.get_response(request)
        return response

    def get_client_ip(self, request):
        """
        Get the client IP address from the request.
        """
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class SecurityHeadersMiddleware:
    """
    Middleware to add security headers to responses.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Add security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        response['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"

        return response
