from django.contrib import admin
from .models import User, Stop, Route, Bus, BusLocation, Ticket

admin.site.register(User)
admin.site.register(Stop)
admin.site.register(Route)
admin.site.register(Bus)
admin.site.register(BusLocation)
admin.site.register(Ticket)
