from .models import RouteStop

def calculate_fare(route_id, start_stop_id, end_stop_id):
    try:
        start_node = RouteStop.objects.filter(route_id=route_id, stop_id=start_stop_id).first()
        # Find the end_stop that appears AFTER the start_stop in the sequence
        end_node = RouteStop.objects.filter(route_id=route_id, stop_id=end_stop_id, order__gt=start_node.order).first()
        
        # Calculate distance based on sequence gap
        distance = (end_node.order - start_node.order) if end_node else 1
        
        base_fare = 20.0
        if distance > 3:
            # Add 5 NPR for every 3 additional stops, maxing at 35 NPR
            fare = min(20.0 + (((distance - 1) // 3) * 5.0), 35.0)
            return fare
        return base_fare
    except (AttributeError, TypeError) as e:
        print(f"[calculate_fare] Error: {e}")
        return 20.0 # Default fallback