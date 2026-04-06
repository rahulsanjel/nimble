import hmac, hashlib, base64, uuid, json
from django.contrib.auth import authenticate, get_user_model
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import get_object_or_404

from .models import *
from .serializers import *
from .services import calculate_fare

User = get_user_model()
SECRET_KEY = "8gBm/:&EnhH.1/q" 
MERCHANT_ID = "EPAYTEST" 

# --- AUTH ---
class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

class LoginView(generics.GenericAPIView):
    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")
        user = authenticate(username=email, password=password) 
        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "user": UserProfileSerializer(user).data
            })
        return Response({"detail": "Invalid credentials"}, status=401)

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    def get_object(self): return self.request.user

# --- PASSENGER DATA ---
class StopListView(generics.ListAPIView):
    queryset = Stop.objects.all()
    serializer_class = StopSerializer
    permission_classes = [AllowAny]

class RouteListView(generics.ListAPIView):
    queryset = Route.objects.all()
    serializer_class = RouteSerializer
    permission_classes = [AllowAny]

class BusListView(generics.ListAPIView):
    queryset = Bus.objects.all()
    serializer_class = BusSerializer
    permission_classes = [AllowAny]

class ActiveBusListView(generics.ListAPIView):
    """This is the one your Passenger Map needs!"""
    serializer_class = BusLocationSerializer
    permission_classes = [AllowAny]
    def get_queryset(self):
        return BusLocation.objects.filter(bus__active=True)

# --- DRIVER OPERATIONS ---
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_driver_shift(request):
    user = request.user
    if user.role != 'driver' or not user.is_verified or not user.assigned_bus:
        return Response({"error": "Unauthorized or No Bus Assigned"}, status=403)
    
    bus = user.assigned_bus
    bus.active = not bus.active
    bus.save()
    return Response({"is_active": bus.active, "bus": bus.number})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_live_location(request):
    user = request.user
    if user.role != 'driver' or not user.assigned_bus:
        return Response({"error": "Unauthorized"}, status=403)
    
    BusLocation.objects.update_or_create(
        bus=user.assigned_bus,
        defaults={
            'lat': request.data.get('lat'),
            'lng': request.data.get('lng'),
            'updated_at': timezone.now()
        }
    )
    return Response({"status": "Updated"})

# --- TRIP & ESEWA ---
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_trip(request):
    bus = get_object_or_404(Bus, id=request.data.get('bus_id'))
    trip = Trip.objects.create(user=request.user, bus=bus, start_stop_id=request.data.get('start_stop_id'), status='ONBOARD')
    bus.current_load += 1
    bus.save()
    return Response({"trip_id": trip.id}, status=201)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def end_trip(request, trip_id):
    trip = get_object_or_404(Trip, id=trip_id, user=request.user)
    fare = calculate_fare(trip.bus.route.id, trip.start_stop.id, request.data.get('end_stop_id'))
    txn_uuid = str(uuid.uuid4())
    
    # eSewa Signature Logic
    amt_str = "{:.1f}".format(fare) if fare % 1 != 0 else str(int(fare))
    data_to_sign = f"total_amount={amt_str},transaction_uuid={txn_uuid},product_code={MERCHANT_ID}"
    signature = base64.b64encode(hmac.new(bytes(SECRET_KEY, 'utf-8'), bytes(data_to_sign, 'utf-8'), hashlib.sha256).digest()).decode()

    trip.end_stop_id = request.data.get('end_stop_id')
    trip.fare_amount = fare
    trip.status = 'PAYMENT_PENDING'
    trip.transaction_uuid = txn_uuid
    trip.save()

    trip.bus.current_load = max(0, trip.bus.current_load - 1)
    trip.bus.save()

    return Response({"fare": fare, "signature": signature, "transaction_uuid": txn_uuid})

@api_view(['GET'])
@permission_classes([AllowAny])
def esewa_verify(request):
    data = json.loads(base64.b64decode(request.GET.get('data')).decode())
    if data.get("status") == "COMPLETE":
        Trip.objects.filter(transaction_uuid=data.get("transaction_uuid")).update(status='COMPLETED')
        return Response({"status": "COMPLETED"})
    return Response({"status": "FAILED"}, status=400)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def dummy_esewa_payment(request):
    Trip.objects.filter(id=request.data.get('trip_id')).update(status='COMPLETED')
    return Response({"message": "Success"})

# --- RESET LOGIC ---
@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_request(request):
    # (Uuid logic here as before)
    return Response({"message": "Sent"})

@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_confirm(request):
    # (Token validation here as before)
    return Response({"message": "Updated"})

class TripListView(generics.ListAPIView):
    serializer_class = TripSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self): return Trip.objects.filter(user=self.request.user).order_by('-created_at')