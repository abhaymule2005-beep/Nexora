from typing import List, Tuple, Dict, Any
from app.models.entities import Place
from app.services.geo import haversine_distance_km, calculate_route_metrics

class RouteOptimizer:
    """
    Route optimizer for daily itineraries.
    Uses nearest-neighbor heuristic + 2-opt reordering to minimize travel distance
    and eliminate unnecessary backtracking.
    """
    def optimize_day_route(self, places: List[Place]) -> Tuple[List[Place], Dict[str, Any]]:
        n = len(places)
        if n <= 2:
            dist, time_min = calculate_route_metrics(places)
            return places, {
                "distance_before_km": dist,
                "distance_after_km": dist,
                "distance_saved_km": 0.0,
                "travel_time_saved_minutes": 0,
                "reduction_percentage": 0.0
            }

        # Calculate initial baseline metrics
        initial_dist, initial_time = calculate_route_metrics(places)

        # 1. Greedy Nearest Neighbor from the first spot (or hotel/start)
        unvisited = list(places[1:])
        ordered = [places[0]]

        while unvisited:
            current = ordered[-1]
            best_idx = 0
            best_dist = float("inf")
            for i, p in enumerate(unvisited):
                d = haversine_distance_km(current.latitude, current.longitude, p.latitude, p.longitude)
                if d < best_dist:
                    best_dist = d
                    best_idx = i
            ordered.append(unvisited.pop(best_idx))

        # 2. 2-Opt Local Search to untangle crossing paths
        improved = True
        best_route = list(ordered)
        best_dist, _ = calculate_route_metrics(best_route)

        iterations = 0
        while improved and iterations < 20:
            improved = False
            iterations += 1
            for i in range(1, len(best_route) - 1):
                for k in range(i + 1, len(best_route)):
                    # Reverse route segment between i and k
                    new_route = best_route[:i] + best_route[i:k+1][::-1] + best_route[k+1:]
                    new_dist, _ = calculate_route_metrics(new_route)
                    if new_dist < best_dist - 0.05: # meaningful reduction
                        best_dist = new_dist
                        best_route = new_route
                        improved = True
                        break
                if improved:
                    break

        optimized_dist, optimized_time = calculate_route_metrics(best_route)
        saved_dist = max(0.0, round(initial_dist - optimized_dist, 2))
        saved_time = max(0, initial_time - optimized_time)
        reduction_pct = round((saved_dist / max(initial_dist, 0.1)) * 100, 1)

        metrics = {
            "distance_before_km": initial_dist,
            "distance_after_km": optimized_dist,
            "distance_saved_km": saved_dist,
            "travel_time_saved_minutes": saved_time,
            "reduction_percentage": reduction_pct
        }

        return best_route, metrics

route_optimizer = RouteOptimizer()
