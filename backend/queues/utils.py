from django.core.mail import send_mail
from django.conf import settings


def send_queue_notification_email(user_email, message):
    """
    Send an email notification to the user.
    """
    subject = "Queue Notification"
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user_email],
            fail_silently=True,  # Changed to True to prevent API failures
        )
    except Exception as e:
        # Log the error but don't fail the API call
        print(f"Email sending failed: {e}")
