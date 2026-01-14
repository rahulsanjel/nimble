# admin.py
from django.contrib import admin
from .models import User, Bus, Route, Stop, Ticket

# ------------------ USER ADMIN ------------------
@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'full_name', 'role', 'assigned_bus', 'is_on_duty', 'is_staff')
    list_filter = ('role', 'is_staff', 'is_on_duty')
    search_fields = ('email', 'full_name', 'assigned_bus__number')
    ordering = ('email',)
    readonly_fields = ('id',)
    filter_horizontal = ('favorite_routes',)

# ------------------ BUS ADMIN ------------------
@admin.register(Bus)
class BusAdmin(admin.ModelAdmin):
    list_display = ('number', 'route', 'capacity', 'active')
    list_filter = ('active', 'route')
    search_fields = ('number',)
    ordering = ('number',)

# ------------------ ROUTE ADMIN ------------------
@admin.register(Route)
class RouteAdmin(admin.ModelAdmin):
    list_display = ('name', 'duration_min')
    filter_horizontal = ('stops',)
    search_fields = ('name',)
    ordering = ('name',)

# ------------------ STOP ADMIN ------------------
@admin.register(Stop)
class StopAdmin(admin.ModelAdmin):
    list_display = ('name', 'lat', 'lng')
    search_fields = ('name',)
    ordering = ('name',)

# ------------------ TICKET ADMIN ------------------
@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'bus', 'paid', 'created_at')
    list_filter = ('paid',)
    search_fields = ('user__email', 'bus__number')
    ordering = ('-created_at',)
