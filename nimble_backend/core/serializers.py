from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import User, Stop, Route, Bus, BusLocation, Ticket
from django.contrib.auth.password_validation import validate_password

User = get_user_model()

# ---- USER SERIALIZERS ----
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'full_name', 'email', 'role', 'assigned_bus']

# ---- AUTH SERIALIZERS ----
class RegisterSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ("full_name", "email", "password", "password2")
        extra_kwargs = {"password": {"write_only": True}}

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password": "Password fields didn’t match."})
        validate_password(attrs["password"])
        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")
        user = User.objects.create_user(**validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()


# ---- TRANSPORT SERIALIZERS ----
class StopSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stop
        fields = ['id', 'name', 'lat', 'lng']


class RouteSerializer(serializers.ModelSerializer):
    stops = StopSerializer(many=True, read_only=True)

    class Meta:
        model = Route
        fields = ['id', 'name', 'stops', 'duration_min']


class BusSerializer(serializers.ModelSerializer):
    route = RouteSerializer(read_only=True)

    class Meta:
        model = Bus
        fields = ['id', 'number', 'route', 'capacity', 'active']


class BusLocationSerializer(serializers.ModelSerializer):
    bus = BusSerializer(read_only=True)

    class Meta:
        model = BusLocation
        fields = ['id', 'bus', 'lat', 'lng', 'updated_at']


class TicketSerializer(serializers.ModelSerializer):
    bus = BusSerializer(read_only=True)
    user = UserSerializer(read_only=True)

    class Meta:
        model = Ticket
        fields = ['id', 'user', 'bus', 'paid', 'created_at']


#
class UserProfileSerializer(serializers.ModelSerializer):
    favorite_routes = RouteSerializer(many=True, read_only=True)
    favorite_routes_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Route.objects.all(), write_only=True, required=False
    )

    # Tickets remain read-only
    tickets = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id", "email", "full_name", "phone", "profile_picture",
            "gender", "blood_group", "dob",
            "favorite_routes", "favorite_routes_ids", "tickets", "role",
        )
        read_only_fields = ("email",)

    def get_tickets(self, obj):
        # Use related_name 'tickets' instead of default '_set'
        tickets = obj.tickets.all().order_by('-created_at')
        from .serializers import TicketSerializer
        return TicketSerializer(tickets, many=True).data

    def update(self, instance, validated_data):
        favorite_routes_ids = validated_data.pop("favorite_routes_ids", None)
        if favorite_routes_ids is not None:
            instance.favorite_routes.set(favorite_routes_ids)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

    
