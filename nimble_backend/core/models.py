from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

# ---- USERS ----
class UserManager(BaseUserManager):
    def create_user(self, email, full_name, password=None, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address")
        email = self.normalize_email(email)
        user = self.model(email=email, full_name=full_name, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, full_name, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, full_name, password, **extra_fields)

GENDER_CHOICES = (
    ("M", "Male"),
    ("F", "Female"),
    ("O", "Other"),
)
ROLE_CHOICES = (
    ("passenger", "Passenger"),
    ("driver", "Driver"),
)

class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)

    # ---- Roles based ----
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="passenger"
    )
    assigned_bus = models.ForeignKey(
        'Bus',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="drivers"
    )
    is_on_duty = models.BooleanField(default=False)

    # ----------Same Auth Fields For Passenger and Driver--------------#
    phone = models.CharField(max_length=15, blank=True, null=True)  # optional phone number
    profile_picture = models.ImageField(upload_to="profiles/", blank=True, null=True)

    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, blank=True, null=True)
    blood_group = models.CharField(max_length=3, blank=True, null=True)
    dob = models.DateField(blank=True, null=True)
    favorite_routes = models.ManyToManyField('Route', blank=True, related_name='fav_users')
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name"]

    def __str__(self):
        return self.email

# ---- BUS STOPS ----
class Stop(models.Model):
    name = models.CharField(max_length=100)
    lat = models.FloatField()
    lng = models.FloatField()

    def __str__(self):
        return self.name


# ---- ROUTES ----
class Route(models.Model):
    name = models.CharField(max_length=100)
    stops = models.ManyToManyField(Stop, related_name="routes")
    duration_min = models.IntegerField(help_text="Total duration in minutes")

    def __str__(self):
        return self.name


# ---- BUSES ----
class Bus(models.Model):
    number = models.CharField(max_length=50)
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name="buses")
    capacity = models.IntegerField(default=40)
    active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.number} ({self.route.name})"


# ---- REAL-TIME GPS TRACKING ----
class BusLocation(models.Model):
    bus = models.ForeignKey(Bus, on_delete=models.CASCADE, related_name="locations")
    lat = models.FloatField()
    lng = models.FloatField()
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.bus.number} @ {self.updated_at}"


# ---- TICKETS ----
class Ticket(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tickets")
    bus = models.ForeignKey(Bus, on_delete=models.CASCADE, related_name="tickets")
    paid = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Ticket {self.id} - {self.user.username} - {self.bus.number}"
