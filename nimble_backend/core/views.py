from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate

from .models import Stop, Route, Bus, BusLocation, Ticket
from .serializers import (
    RegisterSerializer, LoginSerializer,
    StopSerializer, RouteSerializer, BusSerializer, BusLocationSerializer, UserProfileSerializer
)


# ---- AUTH VIEWS ----
class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer

class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            request, email=serializer.validated_data["email"], 
            password=serializer.validated_data["password"]
        )
        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            })
        return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
    
# ---- USER PROFILE VIEW ----
class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    
# ---- ROUTES / STOPS ----
class StopListView(generics.ListAPIView):
    queryset = Stop.objects.all()
    serializer_class = StopSerializer
    permission_classes = [permissions.AllowAny]


class RouteListView(generics.ListAPIView):
    queryset = Route.objects.all()
    serializer_class = RouteSerializer
    permission_classes = [permissions.AllowAny]


class BusListView(generics.ListAPIView):
    queryset = Bus.objects.all()
    serializer_class = BusSerializer
    permission_classes = [permissions.AllowAny]


# ---- BUS LOCATION ----
class BusLocationListView(generics.ListAPIView):
    queryset = BusLocation.objects.all()
    serializer_class = BusLocationSerializer
    permission_classes = [permissions.AllowAny]
