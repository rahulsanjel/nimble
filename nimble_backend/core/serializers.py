from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Stop, Route, RouteStop, Bus, BusLocation, Trip
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


User = get_user_model()

class StopSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stop
        fields = ['id', 'name', 'lat', 'lng']

class RouteStopSerializer(serializers.ModelSerializer):
    stop_name = serializers.ReadOnlyField(source='stop.name')
    lat = serializers.ReadOnlyField(source='stop.lat')
    lng = serializers.ReadOnlyField(source='stop.lng')
    class Meta:
        model = RouteStop
        fields = ['stop', 'stop_name', 'lat', 'lng', 'order']

# serializers.py

class RouteSerializer(serializers.ModelSerializer):
    stops = RouteStopSerializer(source='route_sequences', many=True, read_only=True)

    class Meta:
        model = Route
        fields = ['id', 'name', 'duration_min', 'polyline', 'stops']

class BusSerializer(serializers.ModelSerializer):
    route = RouteSerializer(read_only=True)
    occupancy_pcent = serializers.SerializerMethodField()
    class Meta:
        model = Bus
        fields = ['id', 'number', 'route', 'capacity', 'current_load', 'occupancy_pcent', 'active']
    def get_occupancy_pcent(self, obj):
        return round((obj.current_load / obj.capacity) * 100, 1) if obj.capacity > 0 else 0

# Tweak for your Live Map compatibility
class BusLocationSerializer(serializers.ModelSerializer):
    bus_number = serializers.ReadOnlyField(source='bus.number')
    route_name = serializers.ReadOnlyField(source='bus.route.name')
    # Add this to help calculate ETA
    current_stop_order = serializers.SerializerMethodField()
    lat = serializers.FloatField()
    lng = serializers.FloatField()

    class Meta:
        model = BusLocation
        # Include current_stop_order in fields
        fields = ['id', 'bus', 'bus_number', 'route_name', 'lat', 'lng', 'current_stop_order', 'updated_at']

    def get_current_stop_order(self, obj):
        # Finds the order of the stop closest to the bus's current lat/lng
        stop = RouteStop.objects.filter(route=obj.bus.route, stop__lat=obj.lat, stop__lng=obj.lng).first()
        return stop.order if stop else 0

class TripSerializer(serializers.ModelSerializer):
    bus_number = serializers.ReadOnlyField(source='bus.number')
    route_name = serializers.ReadOnlyField(source='bus.route.name')
    start_stop_name = serializers.ReadOnlyField(source='start_stop.name')
    end_stop_name = serializers.ReadOnlyField(source='end_stop.name')
    class Meta:
        model = Trip
        fields = ['id', 'bus_number', 'route_name', 'start_stop_name', 'end_stop_name', 'status', 'fare_amount', 'created_at']

class RegisterSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ("full_name", "email", "password", "password2", "role")

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        validate_password(attrs["password"])
        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")
        # Passing role explicitly to ensure it saves correctly
        return User.objects.create_user(**validated_data)

class UserProfileSerializer(serializers.ModelSerializer):
    trip_history = serializers.SerializerMethodField()
    profile_picture = serializers.ImageField(required=False, allow_null=True)
    assigned_bus_details = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id", "email", "full_name", "phone", "role", 
            "profile_picture", "gender", "blood_group", "dob", 
            "is_verified", "is_staff", "assigned_bus", 
            "assigned_bus_details", "trip_history"
        )

    def get_trip_history(self, obj):
        if obj.role == 'passenger':
        # Change order_back to order_by
            trips = Trip.objects.filter(user=obj).order_by('-created_at')[:5]
            return TripSerializer(trips, many=True).data
        return []

    def get_assigned_bus_details(self, obj):
        # CRITICAL: This provides the 'route_name' and 'bus_number' for the Driver's Home Screen
        if obj.role == 'driver' and obj.assigned_bus:
            return {
                "bus_number": obj.assigned_bus.number,
                "route_name": obj.assigned_bus.route.name,
                "is_active": obj.assigned_bus.active
            }
        return None

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        
        # LOGIC FIX: Ensure Driver gets 'is_verified' and 'assigned_bus_details'
        if instance.role == 'driver':
            # Remove purely passenger-facing fields
            ret.pop('blood_group', None)
            ret.pop('dob', None)
            ret.pop('trip_history', None)
            # Ensure these STAY for the driver
            # ret['is_verified'] is already there from super()
        
        elif instance.role == 'passenger':
            # Remove purely driver-facing fields
            ret.pop('is_verified', None)
            ret.pop('assigned_bus', None)
            ret.pop('assigned_bus_details', None)
            
        return ret


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # We add the user data to the response dictionary
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'full_name': self.user.full_name,
            'role': self.user.role,
        }
        return data