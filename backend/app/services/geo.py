import math
from typing import Tuple, List, Dict
from app.models.entities import Place

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes great-circle distance between two GPS coordinates using Haversine formula.
    """
    R = 6371.0 # Earth's radius in kilometers

    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    return round(R * c, 2)

def estimate_travel_time_minutes(distance_km: float, mode: str = "car") -> int:
    """
    Estimates travel transit time in minutes given real-world road curvature and typical Goan traffic.
    Average city/coastal speed ~ 30-35 km/h + 5 min buffer.
    """
    if distance_km <= 0.1:
        return 5
    avg_speed_kmh = 32.0 # realistic Goan coastal road average
    hours = distance_km / avg_speed_kmh
    minutes = int(hours * 60) + 5
    return max(10, min(120, minutes))

def calculate_route_metrics(places: List[Place]) -> Tuple[float, int]:
    """
    Returns (total_distance_km, total_travel_time_minutes) for an ordered sequence of places.
    """
    if len(places) <= 1:
        return (0.0, 0)
        
    total_dist = 0.0
    total_time = 0
    for i in range(len(places) - 1):
        d = haversine_distance_km(
            places[i].latitude, places[i].longitude,
            places[i+1].latitude, places[i+1].longitude
        )
        t = estimate_travel_time_minutes(d)
        total_dist += d
        total_time += t
        
    return round(total_dist, 2), total_time
