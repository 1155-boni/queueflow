from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, username, email=None, password=None, role='customer', organization_type=None, **extra_fields):
        if not username:
            raise ValueError('The Username field must be set')
        if email:
            email = self.normalize_email(email)
        user = self.model(username=username, email=email, role=role, organization_type=organization_type, **extra_fields)
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(username, email, password, **extra_fields)


class User(AbstractUser):
    ROLE_CHOICES = (
        ('customer', 'Customer'),
        ('staff', 'Staff'),
    )
    ORGANIZATION_CHOICES = (
        ('bank', 'Bank'),
        ('government', 'Government Official'),
        ('hospital', 'Hospital'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='customer')
    organization_type = models.CharField(max_length=20, choices=ORGANIZATION_CHOICES, blank=True, null=True)
    email = models.EmailField(unique=True, null=True, blank=True)

    objects = UserManager()

    def __str__(self):
        return self.username
