from django.core.management.base import BaseCommand
from core.models import Stop, Route, Bus

class Command(BaseCommand):
    help = "Seed Kathmandu routes with more realistic data"

    def handle(self, *args, **options):
        # Define stops with approximate lat/lng
        stops_data = {
            "Lagankhel Buspark": (27.6679, 85.3209),
            "Jawalakhel": (27.6686, 85.3211),
            "Kupandole": (27.6731, 85.3222),
            "Thapathali": (27.7035, 85.3108),
            "Jamal": (27.7090, 85.3100),
            "Lazimpat": (27.7216, 85.3214),
            "Panipokhari": (27.7300, 85.3208),
            "Samakhusi": (27.7311, 85.3137),
            "New Buspark": (27.7420, 85.3218),
            "Koteshwor": (27.7050, 85.3330),
            "Tinkune": (27.7115, 85.3250),
            "Ratnapark": (27.7150, 85.3140),
            "Godawari": (27.6526, 85.3180),
            "Satdobato": (27.6718, 85.3177),
            "Tripureshwor": (27.7102, 85.3156),
            "Pepsicola": (27.7175, 85.3120),
            "Thimi": (27.6840, 85.3260),
            "Kritipur": (27.6725, 85.3075),
            "Ekantakuna": (27.6740, 85.3000),
            "Jadibuti": (27.7070, 85.3050),
            "New Baneshwor": (27.7120, 85.3240),
            "Bijuli Bazar": (27.7135, 85.3190),
            "Maitighar": (27.7160, 85.3150),
            "Bhadrakali": (27.7180, 85.3125),

        }

        # Create stops
        stops = {}
        for name, (lat, lng) in stops_data.items():
            stop, _ = Stop.objects.get_or_create(name=name, lat=lat, lng=lng)
            stops[name] = stop

        # Define routes & sequences
        routes = {
            "Lagankhel - New Buspark": [
                "Lagankhel Buspark", "Jawalakhel", "Kupandole", "Thapathali",
                "Jamal", "Lazimpat", "Panipokhari", "Samakhusi", "New Buspark",
            ],
            "Koteshwor - Ratnapark": [
                "Koteshwor", "Tinkune", "New Baneshwor", "Bijuli Bazar", 
                "Maitighar", "Bhadrakali", "Ratnapark"
            ],
            "Godawari - Ratnapark": [
                "Godawari", "Satdobato", "Jawalakhel", "Tripureshwor", "Jamal",
                "Ratnapark"
            ],
            "Ratnapark - Lagankhel": [
                "Ratnapark", "Thapathali", "Kupondole",
                "UN Park", "Jawalakhel", "Lagankhel Buspark"
            ],
            "New Buspark - Koteshwor": [
                "New Buspark", "Samakhusi", "Panipokhari", "Lazimpat",
                "Jamal", "Thapathali", "Tinkune", "Koteshwor"
            ],
            "Jamal - Godawari": [
                "Jamal", "Tripureshwor", "Jawalakhel", "Satdobato", 
                "Godawari"
            ],
            "Kritipur - Ratnapark": [
                "Kritipur", "Ekantakuna", "Satdobato", "Koteshwor", "Tinkune",
                "New Baneshwor", "Maitighar", "Ratnapark"  
            ],
            "Pepsicola - Ratnapark": [
                "Pepsicola", "Jadibuti", "Koteshwor", "Tinkune","New Baneshwor",
                "Maitighar", "Ratnapark"
            ],
        }

        # Create routes and assign stops
        for route_name, stop_list in routes.items():
            route_obj, _ = Route.objects.get_or_create(name=route_name, duration_min=len(stop_list)*5)
            route_obj.stops.set([stops[s] for s in stop_list])
            route_obj.save()

            # Create a couple of buses for each route
            for i in range(1, 3):
                Bus.objects.get_or_create(
                    number=f"{route_name[:3].upper()}-{i:02}",
                    route=route_obj,
                    capacity=40,
                    active=True
                )

        self.stdout.write(self.style.SUCCESS("Realistic Kathmandu routes seeded successfully."))
