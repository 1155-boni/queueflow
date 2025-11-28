from django.db import models
from accounts.models import User
import uuid


class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification for {self.user.username}: {self.message[:50]}"


class ServiceType(models.Model):
    """Different types of services offered at government offices"""
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    estimated_duration = models.DurationField(help_text="Estimated time to complete this service")
    requires_documents = models.BooleanField(default=False)
    priority_level = models.IntegerField(default=1, help_text="1=Normal, 2=Priority, 3=VIP")
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class ServicePoint(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    bank_name = models.CharField(max_length=100, blank=True)
    branch = models.CharField(max_length=100, blank=True)
    location = models.CharField(max_length=200, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True, help_text="Latitude coordinate")
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True, help_text="Longitude coordinate")
    directions = models.TextField(blank=True)
    teller_no = models.CharField(max_length=10, blank=True)
    map_url = models.URLField(blank=True, help_text="Google Maps link for the service point location")
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_service_points', default=1)

    # Government-specific fields
    organization_type = models.CharField(max_length=50, choices=[
        ('government', 'Government Office'),
        ('bank', 'Bank'),
        ('hospital', 'Hospital'),
    ], default='government')
    service_types = models.ManyToManyField(ServiceType, blank=True, related_name='service_points')
    supports_appointments = models.BooleanField(default=False)
    supports_priority = models.BooleanField(default=False)
    max_queue_length = models.PositiveIntegerField(default=50)
    display_screen_url = models.URLField(blank=True, help_text="URL for public display screen")

    is_paused = models.BooleanField(default=False)  # New field to pause/resume services at service point

    def __str__(self):
        return self.name


class Appointment(models.Model):
    """Appointment booking system for government services"""
    STATUS_CHOICES = (
        ('scheduled', 'Scheduled'),
        ('confirmed', 'Confirmed'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('no_show', 'No Show'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='appointments')
    service_point = models.ForeignKey(ServicePoint, on_delete=models.CASCADE, related_name='appointments')
    service_type = models.ForeignKey(ServiceType, on_delete=models.CASCADE, related_name='appointments')
    appointment_date = models.DateField()
    appointment_time = models.TimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    qr_code = models.CharField(max_length=100, blank=True, help_text="QR code identifier")

    class Meta:
        ordering = ['appointment_date', 'appointment_time']
        unique_together = ['service_point', 'appointment_date', 'appointment_time']

    def __str__(self):
        return f"{self.user.username} - {self.service_point.name} on {self.appointment_date}"


class Feedback(models.Model):
    """Citizen feedback collection"""
    RATING_CHOICES = (
        (1, 'Very Poor'),
        (2, 'Poor'),
        (3, 'Average'),
        (4, 'Good'),
        (5, 'Excellent'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='feedback')
    service_point = models.ForeignKey(ServicePoint, on_delete=models.CASCADE, related_name='feedback')
    service_type = models.ForeignKey(ServiceType, on_delete=models.SET_NULL, null=True, blank=True)
    rating = models.IntegerField(choices=RATING_CHOICES)
    comments = models.TextField(blank=True)
    wait_time_satisfaction = models.IntegerField(choices=RATING_CHOICES, null=True, blank=True)
    staff_service_rating = models.IntegerField(choices=RATING_CHOICES, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_anonymous = models.BooleanField(default=False)

    def __str__(self):
        return f"Feedback from {self.user.username if not self.is_anonymous else 'Anonymous'} - Rating: {self.rating}"


class Announcement(models.Model):
    """Public announcements for government offices"""
    PRIORITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    )

    title = models.CharField(max_length=200)
    message = models.TextField()
    service_point = models.ForeignKey(ServicePoint, on_delete=models.CASCADE, related_name='announcements')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_announcements')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.service_point.name}"


class DocumentCheck(models.Model):
    """Document verification for government services"""
    STATUS_CHOICES = (
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('requires_correction', 'Requires Correction'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='document_checks')
    service_point = models.ForeignKey(ServicePoint, on_delete=models.CASCADE, related_name='document_checks')
    service_type = models.ForeignKey(ServiceType, on_delete=models.CASCADE, related_name='document_checks')
    document_type = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_documents')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.document_type} check for {self.user.username} - {self.status}"


class AuditLog(models.Model):
    """Security audit logging for government operations"""
    ACTION_CHOICES = (
        ('login', 'User Login'),
        ('logout', 'User Logout'),
        ('create', 'Create Record'),
        ('update', 'Update Record'),
        ('delete', 'Delete Record'),
        ('view', 'View Record'),
        ('print', 'Print Document'),
        ('export', 'Export Data'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='audit_logs')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    resource_type = models.CharField(max_length=50)
    resource_id = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    session_id = models.CharField(max_length=100, blank=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.user.username} - {self.action} - {self.resource_type}"


class PriorityQueue(models.Model):
    """Priority queue management for urgent cases"""
    PRIORITY_LEVELS = (
        (1, 'Normal'),
        (2, 'Priority'),
        (3, 'Urgent'),
        (4, 'Emergency'),
    )

    service_point = models.ForeignKey(ServicePoint, on_delete=models.CASCADE, related_name='priority_queues')
    name = models.CharField(max_length=100)
    priority_level = models.IntegerField(choices=PRIORITY_LEVELS, default=1)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    max_capacity = models.PositiveIntegerField(default=10)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - Priority {self.priority_level}"


class QueueEntry(models.Model):
    STATUS_CHOICES = (
        ('joined', 'Joined'),
        ('waiting', 'Waiting'),
        ('called', 'Called'),
        ('served', 'Served'),
        ('abandoned', 'Abandoned'),
        ('paused', 'Paused'),  # Added for pause/resume functionality
    )

    service_point = models.ForeignKey(ServicePoint, on_delete=models.CASCADE, related_name='queue_entries')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='queue_entries')
    position = models.PositiveIntegerField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='joined')
    joined_at = models.DateTimeField(auto_now_add=True)
    called_at = models.DateTimeField(null=True, blank=True)
    served_at = models.DateTimeField(null=True, blank=True)
    estimated_wait_time = models.DurationField(null=True, blank=True)

    # Government-specific fields
    service_type = models.ForeignKey(ServiceType, on_delete=models.SET_NULL, null=True, blank=True)
    priority_level = models.IntegerField(default=1)
    appointment = models.ForeignKey(Appointment, on_delete=models.SET_NULL, null=True, blank=True)
    ticket_number = models.CharField(max_length=20, unique=True, blank=True)
    qr_code = models.CharField(max_length=100, blank=True)
    sms_sent = models.BooleanField(default=False)

    staff_notes = models.TextField(blank=True)  # New field for staff quick notes

    class Meta:
        ordering = ['priority_level', 'position']

    def save(self, *args, **kwargs):
        if not self.ticket_number:
            # Generate unique ticket number
            import random
            import string
            self.ticket_number = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.username} - Position {self.position} at {self.service_point.name} (Ticket: {self.ticket_number})"
