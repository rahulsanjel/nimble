from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/login/', views.LoginView.as_view(), name='login'),
    path('auth/profile/', views.UserProfileView.as_view(), name='profile'),
    path('auth/password-reset/', views.password_reset_request, name='password_reset'),
    path('auth/password-reset-confirm/', views.password_reset_confirm, name='password_confirm'),

    # Transport Data
    path('stops/', views.StopListView.as_view(), name='stops'),
    path('routes/', views.RouteListView.as_view(), name='routes'),
    path('buses/', views.BusListView.as_view(), name='buses'),
    
    # Live Tracking
    path('active-buses/', views.ActiveBusListView.as_view(), name='active-buses'),
    path('driver/update-location/', views.update_live_location, name='update-location'),
    path('driver/toggle-shift/', views.toggle_driver_shift, name='toggle-shift'),

    # Trips & Payment
    path('trips/', views.TripListView.as_view(), name='trip-history'),
    path('trips/start/', views.start_trip, name='start-trip'),
    path('trips/<int:trip_id>/end/', views.end_trip, name='end-trip'),
    path('esewa/verify/', views.esewa_verify, name='esewa-verify'),
    path('esewa/dummy-pay/', views.dummy_esewa_payment, name='dummy-pay'),
]