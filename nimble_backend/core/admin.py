from django.contrib import admin
from django import forms
from .models import (
    User, Driver, Passenger, Stop, Route, 
    RouteStop, Bus, BusLocation, Trip, PasswordResetToken
)

# ------------------ INLINES ------------------

class RouteStopInline(admin.TabularInline):
    model = RouteStop
    extra = 1
    ordering = ('order',)

class BusInline(admin.TabularInline):
    """Allows managing buses directly inside a Route's page."""
    model = Bus
    extra = 0
    fields = ['number', 'capacity', 'active']

# ------------------ 1. PASSENGER ADMIN ------------------

@admin.register(Passenger)
class PassengerAdmin(admin.ModelAdmin):
    list_display = ('email', 'full_name', 'phone', 'is_verified', 'is_active')
    list_filter = ('is_verified', 'is_active')
    search_fields = ('email', 'full_name', 'phone')
    ordering = ('-id',)

    def get_queryset(self, request):
        return super().get_queryset(request).filter(role='passenger')

# ------------------ 2. SMART DRIVER ADMIN ------------------

@admin.register(Driver)
class DriverAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'get_route_name', 'assigned_bus', 'is_verified', 'is_active')
    list_filter = ('is_verified', 'is_active', 'assigned_bus__route')
    list_editable = ('assigned_bus', 'is_verified', 'is_active')
    search_fields = ('full_name', 'email', 'phone')
    ordering = ('-id',)

    def get_queryset(self, request):
        return super().get_queryset(request).filter(role='driver')

    def get_route_name(self, obj):
        return obj.assigned_bus.route.name if obj.assigned_bus else "No Route"
    get_route_name.short_description = "Current Route"

    def render_change_form(self, request, context, *args, **kwargs):
        """
        ROUTE-FIRST LOGIC: 
        Filters the Bus dropdown to show the Route first and only list AVAILABLE buses.
        """
        form = context['adminform'].form
        
        # 1. Identify buses already taken by other drivers
        current_driver_id = context.get('object_id')
        taken_buses = User.objects.filter(role='driver').exclude(id=current_driver_id).values_list('assigned_bus_id', flat=True)
        
        # 2. Filter the Bus dropdown: Exclude taken buses and optimize query
        bus_qs = Bus.objects.exclude(id__in=taken_buses).select_related('route')
        form.fields['assigned_bus'].queryset = bus_qs
        
        # 3. Prettify the label: [Route Name] --- Bus Number
        form.fields['assigned_bus'].label_from_instance = lambda obj: f"[{obj.route.name}] — Bus: {obj.number}"
        
        return super().render_change_form(request, context, *args, **kwargs)

# ------------------ 3. ROUTE & BUS ADMIN ------------------

@admin.register(Route)
class RouteAdmin(admin.ModelAdmin):
    list_display = ('name', 'duration_min', 'get_bus_count')
    inlines = [RouteStopInline, BusInline]
    search_fields = ('name',)

    def get_bus_count(self, obj):
        return obj.buses.count()
    get_bus_count.short_description = "Buses on Route"

@admin.register(Bus)
class BusAdmin(admin.ModelAdmin):
    list_display = ('number', 'route', 'get_current_driver', 'active', 'capacity')
    list_filter = ('active', 'route')
    list_editable = ('active', 'route')
    search_fields = ('number',)

    def get_current_driver(self, obj):
        driver = User.objects.filter(assigned_bus=obj).first()
        return driver.full_name if driver else "⚠️ Unassigned"
    get_current_driver.short_description = "Assigned Driver"

# ------------------ 4. LOGS & SYSTEM DATA ------------------

@admin.register(BusLocation)
class BusLocationAdmin(admin.ModelAdmin):
    list_display = ('bus', 'lat', 'lng', 'updated_at')
    readonly_fields = ('updated_at',)

@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'bus', 'status', 'fare_amount', 'created_at')
    list_filter = ('status', 'created_at')
    readonly_fields = ('created_at',)

@admin.register(Stop)
class StopAdmin(admin.ModelAdmin):
    list_display = ('name', 'lat', 'lng')
    search_fields = ('name',)

@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    list_display = ('user', 'token', 'created_at')

# ------------------ 5. BASE USER (For emergency/staff access) ------------------

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'full_name', 'role', 'is_staff', 'is_active')
    list_filter = ('role', 'is_staff', 'is_active')
    
    fieldsets = (
        ('Personal Info', {'fields': ('email', 'password', 'full_name', 'phone', 'profile_picture')}),
        ('Transport Role', {'fields': ('role', 'assigned_bus')}),
        ('Identity Details', {'fields': ('gender', 'blood_group', 'dob')}),
        ('Permissions', {'fields': ('is_verified', 'is_active', 'is_staff', 'is_superuser')}),
    )