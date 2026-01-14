from django.urls import path
from .views import (
    RegisterView, LoginView,
    StopListView, RouteListView, BusListView, BusLocationListView, UpdateBusLocationView, UserProfileView
)
from rest_framework_simplejwt.views import TokenRefreshView
from django.contrib.auth import views as auth_views

urlpatterns = [
    # Auth
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    #password reset can be added here
    path("auth/password_reset/", auth_views.PasswordResetView.as_view(), name="password_reset"),
    path("auth/password_reset/done/", auth_views.PasswordResetDoneView.as_view(), name="password_reset_done"),
    path("auth/reset/<uidb64>/<token>/", auth_views.PasswordResetConfirmView.as_view(), name="password_reset_confirm"),
    path("auth/reset/done/", auth_views.PasswordResetCompleteView.as_view(), name="password_reset_complete"),

    # User Profile
    path("auth/profile/", UserProfileView.as_view(), name="user_profile"),
    
    # Transport
    path('stops/', StopListView.as_view(), name='stops'),
    path('routes/', RouteListView.as_view(), name='routes'),
    path('buses/', BusListView.as_view(), name='buses'),
    path('bus-locations/', BusLocationListView.as_view(), name='bus-locations'),
    
    #Bus location update endpoint for drivers
    path("bus-locations/update/", UpdateBusLocationView.as_view(), name="bus-location-update"),
]
