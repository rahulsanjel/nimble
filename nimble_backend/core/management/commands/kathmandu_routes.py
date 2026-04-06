import random
from django.core.management.base import BaseCommand
from core.models import Stop, Route, RouteStop, Bus

class Command(BaseCommand):
    help = "Seed 10 linear Kathmandu routes for two-way simulation"

    def handle(self, *args, **options):
        self.stdout.write("Seeding Kathmandu Transit Data...")

        stops_data = {
            "Ratnapark": (27.7064, 85.3149),
            "Lagankhel Buspark": (27.6674, 85.3218),
            "New Buspark (Gongabu)": (27.7345, 85.3115),
            "Kalanki": (27.6938, 85.2817),
            "Koteshwor": (27.6774, 85.3486),
            "Chabahil": (27.7174, 85.3444),
            "Tribhuvan Airport": (27.6984, 85.3591),
            "Balkhu": (27.6845, 85.2925),
            "Narayan Gopal Chowk": (27.7351, 85.3312),
            "Sukedhara": (27.7275, 85.3435),
            "Boudha": (27.7215, 85.3620),
            "Jorpati": (27.7225, 85.3765),
            "Sankhu": (27.7320, 85.4610),
            "Budhanilkantha": (27.7780, 85.3610),
            "Sama Khusi": (27.7300, 85.3180),
            "Satdobato": (27.6620, 85.3260),
            "Ekantakuna": (27.6675, 85.3080),
            "Jawalakhel": (27.6740, 85.3150),
            "Swayambhu": (27.7125, 85.2855),
            "Balaju": (27.7305, 85.3015),
            "Thankot": (27.6850, 85.2050),
            "Pharping": (27.6140, 85.2750),
            "New Baneshwor": (27.6915, 85.3331),
            "Maitighar": (27.6939, 85.3215),
            "Tripureshwor": (27.6945, 85.3125),
            "Teku": (27.6970, 85.3030),
            "Kamalpokhari": (27.7095, 85.3265),
            "Bhaktapur Dudhpati": (27.6720, 85.4280),
            "Thamel": (27.7145, 85.3110),
            "Lainchaur": (27.7170, 85.3140),
            "Lazimpat": (27.7230, 85.3200),
        }

        # Create/Update Stops
        stops = {}
        for name, (lat, lng) in stops_data.items():
            stop, _ = Stop.objects.update_or_create(name=name, defaults={'lat': lat, 'lng': lng})
            stops[name] = stop

        # Route Definitions (Linear)
        routes_dict = {
            "Ring Road Sector": ["Kalanki", "Swayambhu", "Balaju", "New Buspark (Gongabu)", "Narayan Gopal Chowk", "Sukedhara", "Chabahil", "Koteshwor", "Satdobato", "Balkhu"],
            "Ratnapark - Sankhu": ["Ratnapark", "Kamalpokhari", "Chabahil", "Boudha", "Jorpati", "Sankhu"],
            "Lagankhel - Gongabu": ["Lagankhel Buspark", "Jawalakhel", "Tripureshwor", "Ratnapark", "Lainchaur", "Lazimpat", "Sama Khusi", "New Buspark (Gongabu)"],
            "Thankot - Ratnapark": ["Thankot", "Kalanki", "Balkhu", "Teku", "Tripureshwor", "Ratnapark"],
            "Airport Shuttle": ["Ratnapark", "Maitighar", "New Baneshwor", "Tribhuvan Airport"],
            "Budhanilkantha Line": ["Ratnapark", "Lainchaur", "Lazimpat", "Narayan Gopal Chowk", "Budhanilkantha"],
            "Bhaktapur Express": ["Ratnapark", "Maitighar", "New Baneshwor", "Koteshwor", "Bhaktapur Dudhpati"],
            "Patan - Chabahil": ["Lagankhel Buspark", "Satdobato", "Koteshwor", "Chabahil"],
            "Pharping - Ratnapark": ["Pharping", "Balkhu", "Teku", "Tripureshwor", "Ratnapark"],
            "Balaju - Ratnapark": ["Balaju", "Sama Khusi", "Lainchaur", "Thamel", "Ratnapark"],
        }

        for route_name, stop_list in routes_dict.items():
            route_obj, _ = Route.objects.get_or_create(name=route_name, defaults={'duration_min': len(stop_list) * 8})
            
            # Reset Route mapping
            RouteStop.objects.filter(route=route_obj).delete()
            for idx, stop_name in enumerate(stop_list):
                RouteStop.objects.create(route=route_obj, stop=stops[stop_name], order=idx)

            # Create 3 Buses per route
            for i in range(1, 4):
                Bus.objects.get_or_create(
                    number=f"BA-{route_name[:2].upper()}-{random.randint(1000, 9999)}",
                    route=route_obj,
                    defaults={'capacity': 40, 'active': True}
                )

        self.stdout.write(self.style.SUCCESS("Database seeded successfully!"))