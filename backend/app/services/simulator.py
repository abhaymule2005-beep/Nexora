from typing import Dict, Any
from sqlalchemy.orm import Session
from app.schemas.trip import (
    SimulationRequest, SimulationResponse, ItineraryResponse, ReplanRequest
)
from app.services.replanner import dynamic_replanner

class WhatIfSimulator:
    """
    Simulation engine to preview 'What-If' scenarios:
    - Sudden weather change
    - Budget reduction
    - Attraction closure
    """
    def simulate(
        self,
        db: Session,
        itinerary: ItineraryResponse,
        request: SimulationRequest
    ) -> SimulationResponse:
        scenario = request.scenario_type
        target_day = request.day or 1

        affected_act_name = request.affected_activity
        if not affected_act_name:
            # Pick first high weather sensitivity or most expensive place on target day
            day_acts = [
                d.activities for d in itinerary.days if d.day == target_day
            ]
            if day_acts and day_acts[0]:
                if scenario == "weather_change":
                    weather_sensitive = [a for a in day_acts[0] if a.place.weather_sensitivity == "high"]
                    affected_act_name = weather_sensitive[0].place.name if weather_sensitive else day_acts[0][0].place.name
                elif scenario == "budget_cut":
                    most_expensive = sorted(day_acts[0], key=lambda a: a.place.cost, reverse=True)
                    affected_act_name = most_expensive[0].place.name
                else:
                    affected_act_name = day_acts[0][0].place.name
            else:
                affected_act_name = "Baga Beach"

        # Formulate replan request
        reason = f"Simulated {scenario.replace('_', ' ')}: {request.weather_condition or 'disruption'}"
        new_budget = None
        if scenario == "budget_cut":
            delta = request.budget_delta or 5000.0
            new_budget = max(5000.0, itinerary.total_cost + itinerary.remaining_budget - delta)
            reason = f"Simulated budget cut of ₹{int(delta):,}"

        replan_req = ReplanRequest(
            event_type=scenario,
            day=target_day,
            affected_activity=affected_act_name,
            reason=reason,
            new_budget=new_budget
        )

        result = dynamic_replanner.replan(db, itinerary, replan_req)

        cost_diff = round(result.updated_itinerary.total_cost - itinerary.total_cost, 2)
        dist_diff = round(result.updated_itinerary.total_distance_km - itinerary.total_distance_km, 2)

        impact_desc = (
            f"Under the simulated scenario, '{affected_act_name}' on Day {target_day} was swapped "
            f"for '{result.new_activity}'. Total cost changed by ₹{int(cost_diff):,}, and route distance "
            f"shifted by {dist_diff:+.1f} km. All other days were preserved without schedule disruption."
        )

        return SimulationResponse(
            scenario=scenario,
            impact_description=impact_desc,
            original_itinerary=itinerary,
            updated_itinerary=result.updated_itinerary,
            activities_changed_count=result.activities_changed,
            activities_preserved_count=result.activities_preserved,
            cost_difference=cost_diff,
            distance_difference_km=dist_diff
        )

what_if_simulator = WhatIfSimulator()
