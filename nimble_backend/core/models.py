from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
from datetime import timedelta

# --- MANAGER ---
class UserManager(BaseUserManager):
    def create_user(self, email, full_name, password=None, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address")
        email = self.normalize_email(email)
        extra_fields.setdefault("is_verified", False)
        user = self.model(email=email, full_name=full_name, **extra_fields)
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, full_name, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("is_verified", True)
        return self.create_user(email, full_name, password, **extra_fields)

# --- USER MODELS ---
class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)
    role = models.CharField(max_length=20, choices=(("passenger", "Passenger"), ("driver", "Driver")), default="passenger")
    assigned_bus = models.ForeignKey('Bus', on_delete=models.SET_NULL, null=True, blank=True, related_name="drivers")
    phone = models.CharField(max_length=15, blank=True, null=True)
    profile_picture = models.ImageField(upload_to="profiles/", blank=True, null=True)
    gender = models.CharField(max_length=1, choices=(("M", "Male"), ("F", "Female"), ("O", "Other")), blank=True, null=True)
    blood_group = models.CharField(max_length=3, blank=True, null=True)
    dob = models.DateField(blank=True, null=True)
    
    # Gatekeepers
    is_verified = models.BooleanField(default=False) # Manual Admin Approval
    is_active = models.BooleanField(default=True)   # System Access
    is_staff = models.BooleanField(default=False)

    objects = UserManager()
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name"]

    def __str__(self): return self.email

# --- PROXY MODELS FOR ADMIN SEPARATION ---
class Driver(User):
    class Meta:
        proxy = True
        verbose_name = 'Driver'
        verbose_name_plural = 'Drivers'

class Passenger(User):
    class Meta:
        proxy = True
        verbose_name = 'Passenger'
        verbose_name_plural = 'Passengers'

# --- TRANSPORT MODELS ---
class Stop(models.Model):
    name = models.CharField(max_length=100)
    lat = models.FloatField()
    lng = models.FloatField()
    def __str__(self): return self.name

class Route(models.Model):
    name = models.CharField(max_length=100)
    duration_min = models.IntegerField()
    polyline = models.TextField(blank=True, null=True) 
    def __str__(self): return self.name

class RouteStop(models.Model):
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name="route_sequences")
    stop = models.ForeignKey(Stop, on_delete=models.CASCADE)
    order = models.PositiveIntegerField() 
    class Meta: ordering = ['order']

class Bus(models.Model):
    number = models.CharField(max_length=50)
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name="buses")
    capacity = models.IntegerField(default=40)
    current_load = models.IntegerField(default=0)
    active = models.BooleanField(default=False) 
    def __str__(self): return self.number

class BusLocation(models.Model):
    bus = models.OneToOneField(Bus, on_delete=models.CASCADE, related_name="location")
    lat = models.FloatField()
    lng = models.FloatField()
    updated_at = models.DateTimeField(auto_now=True)

class Trip(models.Model):
    STATUS_CHOICES = [
        ('ONBOARD', 'Currently Riding'),
        ('PAYMENT_PENDING', 'Waiting for eSewa'),
        ('COMPLETED', 'Paid'),
        ('CANCELLED', 'Cancelled')
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    bus = models.ForeignKey(Bus, on_delete=models.CASCADE)
    start_stop = models.ForeignKey(Stop, related_name='trips_started', on_delete=models.PROTECT)
    end_stop = models.ForeignKey(Stop, related_name='trips_ended', null=True, blank=True, on_delete=models.PROTECT)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ONBOARD')
    fare_amount = models.DecimalField(max_digits=6, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    transaction_uuid = models.CharField(max_length=255, null=True, blank=True, unique=True)

class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token = models.CharField(max_length=8)
    created_at = models.DateTimeField(auto_now_add=True)
    def is_valid(self):
        return self.created_at >= timezone.now() - timedelta(minutes=10)