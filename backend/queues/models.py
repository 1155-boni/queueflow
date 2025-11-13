from django.db import models
from accounts.models import User


class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification for {self.user.username}: {self.message[:50]}"


class ServicePoint(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    location = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_service_points')

    def __str__(self):
        return self.name


class QueueEntry(models.Model):
    STATUS_CHOICES = (
        ('waiting', 'Waiting'),
        ('called', 'Called'),
        ('served', 'Served'),
        ('abandoned', 'Abandoned'),
    )

    service_point = models.ForeignKey(ServicePoint, on_delete=models.CASCADE, related_name='queue_entries')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='queue_entries')
    position = models.PositiveIntegerField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='waiting')
    joined_at = models.DateTimeField(auto_now_add=True)
    called_at = models.DateTimeField(null=True, blank=True)
    served_at = models.DateTimeField(null=True, blank=True)
    estimated_wait_time = models.DurationField(null=True, blank=True)

    class Meta:
        ordering = ['position']

    def __str__(self):
        return f"{self.user.username} - Position {self.position} at {self.service_point.name}"
