import time
import requests
from django.core.management.base import BaseCommand
from core.models import Route, RouteStop


class Command(BaseCommand):
    help = "Fetches real-road geometries from OSRM for all defined routes"

    def add_arguments(self, parser):
        parser.add_argument(
            "--refresh",
            action="store_true",
            help="Force re-fetch even for routes that already have a polyline",
        )
        parser.add_argument(
            "--route",
            type=str,
            default=None,
            help="Fetch only a specific route by name (partial match)",
        )

    def handle(self, *args, **options):
        if options["route"]:
            routes = Route.objects.filter(name__icontains=options["route"])
        elif options["refresh"]:
            routes = Route.objects.all()
        else:
            # Only fetch routes missing a road-snapped path
            routes = Route.objects.filter(polyline__isnull=True) | Route.objects.filter(polyline="")

        routes = list(routes)

        if not routes:
            self.stdout.write(self.style.SUCCESS("All routes already have road-snapped paths. Use --refresh to update."))
            return

        self.stdout.write(f"Fetching road paths for {len(routes)} route(s)...\n")

        success_count = 0
        fail_count = 0

        for route in routes:
            route_stops = RouteStop.objects.filter(route=route).order_by("order").select_related("stop")

            if route_stops.count() < 2:
                self.stdout.write(self.style.WARNING(f"  ⚠  Skipping '{route.name}': needs at least 2 stops."))
                fail_count += 1
                continue

            # OSRM expects  lng,lat  pairs (note: longitude FIRST)
            coords_string = ";".join(
                f"{float(rs.stop.lng)},{float(rs.stop.lat)}" for rs in route_stops
            )

            # overview=full  → high-detail geometry covering the entire route
            # geometries=polyline6  → higher precision than standard polyline5
            # steps=false  → we don't need turn-by-turn instructions
            url = (
                f"http://router.project-osrm.org/route/v1/driving/{coords_string}"
                f"?overview=full&geometries=polyline6&steps=false&annotations=false"
            )

            try:
                self.stdout.write(f"  → {route.name}")
                response = requests.get(url, timeout=20)
                response.raise_for_status()
                data = response.json()

                if data.get("code") == "Ok":
                    geometry = data["routes"][0]["geometry"]
                    distance_km = round(data["routes"][0]["distance"] / 1000, 2)
                    duration_min = round(data["routes"][0]["duration"] / 60)

                    route.polyline = geometry
                    # Optionally persist real distance/duration from OSRM
                    route.distance_km = distance_km
                    route.duration_min = duration_min
                    route.save(update_fields=["polyline", "distance_km", "duration_min"])

                    self.stdout.write(
                        self.style.SUCCESS(
                            f"     ✅  Saved  ({distance_km} km, ~{duration_min} min)"
                        )
                    )
                    success_count += 1

                else:
                    self.stdout.write(
                        self.style.ERROR(f"     ❌  OSRM error: {data.get('message', 'unknown')}")
                    )
                    fail_count += 1

                # Respect the free public OSRM server — don't hammer it
                time.sleep(1.5)

            except requests.exceptions.Timeout:
                self.stdout.write(self.style.ERROR(f"     ❌  Timeout for '{route.name}'"))
                fail_count += 1
            except requests.exceptions.RequestException as e:
                self.stdout.write(self.style.ERROR(f"     ❌  Network error: {e}"))
                fail_count += 1

        self.stdout.write(
            f"\n{'─'*40}\n"
            f"Done.  ✅ {success_count} saved   ❌ {fail_count} failed\n"
        )