from typing import List, Dict, Any, Tuple
from ortools.sat.python import cp_model
from app.models.entities import Place
from app.services.geo import estimate_travel_time_minutes, haversine_distance_km

def parse_time_str_to_minutes(time_str: str) -> int:
    """Parses 'HH:MM' into minutes from 00:00."""
    try:
        parts = time_str.split(":")
        return int(parts[0]) * 60 + int(parts[1])
    except Exception:
        return 9 * 60 # default 09:00

def minutes_to_time_str(minutes: int) -> str:
    """Converts minutes from midnight to 'HH:MM'."""
    h = (minutes // 60) % 24
    m = minutes % 60
    return f"{h:02d}:{m:02d}"

class ConstraintScheduler:
    """
    Google OR-Tools CP-SAT constraint scheduler.
    Enforces opening hours, activity durations, transit times, and lunch breaks.
    """
    def schedule_day(
        self,
        places: List[Place],
        day_start_hour: int = 9,
        day_end_hour: int = 21,
        include_lunch_break: bool = True
    ) -> List[Dict[str, Any]]:
        if not places:
            return []

        model = cp_model.CpModel()
        day_start = day_start_hour * 60 # e.g. 540 min (09:00)
        day_end = day_end_hour * 60     # e.g. 1260 min (21:00)

        n = len(places)
        intervals = []
        start_vars = []
        end_vars = []

        # 1. Variables for each activity
        for i, place in enumerate(places):
            duration = max(30, min(180, place.duration_minutes))
            open_min = max(day_start, parse_time_str_to_minutes(place.opening_time))
            close_min = min(day_end, parse_time_str_to_minutes(place.closing_time))

            # Ensure valid bounds
            if open_min + duration > close_min:
                # If window is tight, adjust close_min slightly or use place open
                close_min = max(close_min, open_min + duration)

            start = model.NewIntVar(open_min, close_min - duration, f"start_{i}")
            end = model.NewIntVar(open_min + duration, close_min, f"end_{i}")
            interval = model.NewIntervalVar(start, duration, end, f"interval_{i}")

            start_vars.append(start)
            end_vars.append(end)
            intervals.append(interval)

        # 2. Sequential ordering constraint with transit buffers
        for i in range(n - 1):
            dist = haversine_distance_km(
                places[i].latitude, places[i].longitude,
                places[i+1].latitude, places[i+1].longitude
            )
            transit = estimate_travel_time_minutes(dist)
            # end of current activity + transit buffer <= start of next activity
            model.Add(end_vars[i] + transit <= start_vars[i + 1])

        # 3. Lunch break constraint (around 13:00 - 14:00)
        # Avoid activities spanning directly through the lunch peak if 3+ activities
        if include_lunch_break and n >= 3:
            lunch_start = 13 * 60 # 780
            lunch_end = 14 * 60   # 840
            lunch_interval = model.NewIntervalVar(lunch_start, 60, lunch_end, "lunch")
            intervals.append(lunch_interval)

        # 4. No overlap between any intervals
        model.AddNoOverlap(intervals)

        # 5. Objective: minimize total span and delays
        model.Minimize(end_vars[-1] - start_vars[0])

        # Solve with CP-SAT
        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = 2.0
        status = solver.Solve(model)

        scheduled_activities = []
        if status in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
            for i, place in enumerate(places):
                s_min = int(solver.Value(start_vars[i]))
                e_min = int(solver.Value(end_vars[i]))
                transit = 0
                if i > 0:
                    dist = haversine_distance_km(
                        places[i-1].latitude, places[i-1].longitude,
                        places[i].latitude, places[i].longitude
                    )
                    transit = estimate_travel_time_minutes(dist)

                scheduled_activities.append({
                    "place": place,
                    "start_time": minutes_to_time_str(s_min),
                    "end_time": minutes_to_time_str(e_min),
                    "travel_time": transit,
                    "order_index": i
                })
        else:
            # Fallback greedy chronological scheduler
            current_time = day_start
            for i, place in enumerate(places):
                open_min = parse_time_str_to_minutes(place.opening_time)
                close_min = parse_time_str_to_minutes(place.closing_time)
                duration = place.duration_minutes

                transit = 0
                if i > 0:
                    dist = haversine_distance_km(
                        places[i-1].latitude, places[i-1].longitude,
                        places[i].latitude, places[i].longitude
                    )
                    transit = estimate_travel_time_minutes(dist)
                    current_time += transit

                # Ensure after opening time
                start_time_min = max(current_time, open_min)
                end_time_min = start_time_min + duration

                # Insert lunch buffer if needed
                if 750 <= start_time_min < 840 and i > 0:
                    start_time_min = 840
                    end_time_min = start_time_min + duration

                scheduled_activities.append({
                    "place": place,
                    "start_time": minutes_to_time_str(start_time_min),
                    "end_time": minutes_to_time_str(end_time_min),
                    "travel_time": transit,
                    "order_index": i
                })
                current_time = end_time_min

        return scheduled_activities

constraint_scheduler = ConstraintScheduler()
