from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.entities import Place, Trip, Itinerary, ItineraryActivity, ReplanningEvent
from app.schemas.trip import ReplanRequest, ReplanningResult, ItineraryResponse, DayPlan, ActivityResponse, PlaceResponse
from app.services.route_optimizer import route_optimizer
from app.services.scheduler import constraint_scheduler
from app.services.geo import calculate_route_metrics
from app.services.budget_engine import budget_engine
from app.services.weather import weather_service
from app.services.validator import itinerary_validator

class DynamicReplanner:
    """
    Signature Nexora Minimal-Change Replanning Engine:
    1. Detects disruption on specific activity / day
    2. Freezes unaffected days and activities
    3. Searches for contextual candidate replacements
    4. Re-optimizes only affected portion
    5. Re-validates resulting itinerary
    6. Logs event audit trail
    """
    def replan(
        self,
        db: Session,
        itinerary: ItineraryResponse,
        request: ReplanRequest
    ) -> ReplanningResult:
        affected_day_num = request.day
        affected_name = request.affected_activity.strip().lower()

        # Gather places already in the entire itinerary to avoid duplicate re-selection
        all_scheduled_names = set()
        for d in itinerary.days:
            for act in d.activities:
                all_scheduled_names.add(act.place.name.lower())

        # Find candidate replacements from DB
        db_places = db.query(Place).all()
        candidate_pool = [
            p for p in db_places
            if p.name.lower() not in all_scheduled_names
        ]

        replacement_place: Optional[Place] = None
        replacement_reason = ""

        if request.event_type == "weather_change":
            # Prefer indoor activities with low weather sensitivity (Museums, Art, Indoor Culture, Covered Spice Farm)
            indoor_candidates = [
                p for p in candidate_pool
                if (p.weather_sensitivity or "low").lower() == "low"
            ]
            if indoor_candidates:
                # Pick highest rated indoor candidate
                indoor_candidates.sort(key=lambda p: p.rating, reverse=True)
                replacement_place = indoor_candidates[0]
                replacement_reason = f"Indoor {replacement_place.category} resilient to rain, replacing {request.affected_activity}"
        elif request.event_type == "budget_cut":
            # Prefer free or low-cost activities
            low_cost_candidates = [
                p for p in candidate_pool
                if p.cost <= 50
            ]
            if low_cost_candidates:
                low_cost_candidates.sort(key=lambda p: p.rating, reverse=True)
                replacement_place = low_cost_candidates[0]
                replacement_reason = f"Budget-friendly {replacement_place.category} (₹{int(replacement_place.cost)}) reducing trip cost"
        else: # attraction closure or generic disruption
            # Match category of old activity
            same_cat = [
                p for p in candidate_pool
                if p.category.lower() in request.reason.lower() or p.rating >= 4.3
            ]
            if same_cat:
                replacement_place = same_cat[0]
                replacement_reason = f"Alternative {replacement_place.category} substitute"

        if not replacement_place and candidate_pool:
            replacement_place = candidate_pool[0]
            replacement_reason = f"Alternative highlight {replacement_place.name}"

        # Build updated days: freeze unaffected days, update only target day
        updated_days: List[DayPlan] = []
        activities_changed = 0
        activities_preserved = 0
        total_trip_dist = 0.0
        total_trip_time = 0.0
        all_places_list: List[Place] = []

        for d in itinerary.days:
            if d.day != affected_day_num:
                # FREEZE: Keep completely identical
                updated_days.append(d)
                activities_preserved += len(d.activities)
                total_trip_dist += d.day_distance_km
                total_trip_time += d.day_travel_minutes
                for act in d.activities:
                    p = db.query(Place).get(act.place.id)
                    if p:
                        all_places_list.append(p)
            else:
                # TARGET DAY REPAIR
                day_places: List[Place] = []
                for act in d.activities:
                    if act.place.name.lower() == affected_name or affected_name in act.place.name.lower():
                        # Replace
                        if replacement_place:
                            day_places.append(replacement_place)
                            activities_changed += 1
                    else:
                        p = db.query(Place).get(act.place.id)
                        if p:
                            day_places.append(p)
                            activities_preserved += 1

                # If replacement wasn't found or place didn't match, ensure at least one change
                if activities_changed == 0 and day_places and replacement_place:
                    day_places[0] = replacement_place
                    activities_changed = 1
                    activities_preserved = max(0, activities_preserved - 1)

                # Route optimize repaired day
                ordered_day, _ = route_optimizer.optimize_day_route(day_places)

                # Re-schedule repaired day
                scheduled_day = constraint_scheduler.schedule_day(ordered_day)

                repaired_acts: List[ActivityResponse] = []
                day_dist, day_t = calculate_route_metrics(ordered_day)
                day_c = 0.0

                for s_act in scheduled_day:
                    p_obj = s_act["place"]
                    all_places_list.append(p_obj)
                    cost = float(p_obj.cost)
                    day_c += cost
                    
                    reason_str = replacement_reason if p_obj.id == (replacement_place.id if replacement_place else -1) else "Preserved original activity"

                    repaired_acts.append(ActivityResponse(
                        day=affected_day_num,
                        order_index=s_act["order_index"],
                        start_time=s_act["start_time"],
                        end_time=s_act["end_time"],
                        travel_time=s_act["travel_time"],
                        estimated_cost=cost,
                        reason=reason_str,
                        place=PlaceResponse.from_orm(p_obj)
                    ))

                total_trip_dist += day_dist
                total_trip_time += day_t

                updated_days.append(DayPlan(
                    day=affected_day_num,
                    date=d.date,
                    activities=repaired_acts,
                    day_cost=day_c,
                    day_distance_km=day_dist,
                    day_travel_minutes=day_t,
                    weather_forecast=d.weather_forecast
                ))

        # Recompute budget
        target_budget = request.new_budget if request.new_budget else itinerary.total_cost + itinerary.remaining_budget
        budget_summary = budget_engine.calculate_budget(
            places=all_places_list,
            total_distance_km=total_trip_dist,
            days=itinerary.days_count,
            travelers=2,
            target_budget=target_budget
        )

        # Re-validate
        validation = itinerary_validator.validate(
            days=updated_days,
            target_budget=target_budget,
            total_estimated_cost=budget_summary["total_estimated_cost"]
        )

        # Log ReplanningEvent in DB
        rep_event = ReplanningEvent(
            trip_id=itinerary.trip_id or 1,
            reason=f"[{request.event_type.upper()}] {request.reason}",
            old_activity=request.affected_activity,
            new_activity=replacement_place.name if replacement_place else "None"
        )
        db.add(rep_event)
        db.commit()

        new_itinerary_response = ItineraryResponse(
            id=itinerary.id,
            trip_id=itinerary.trip_id,
            destination=itinerary.destination,
            days_count=itinerary.days_count,
            total_cost=budget_summary["total_estimated_cost"],
            remaining_budget=budget_summary["remaining_budget"],
            budget_status=budget_summary["status"],
            total_distance_km=round(total_trip_dist, 2),
            total_travel_time_minutes=total_trip_time,
            status="replanned",
            days=updated_days,
            validation=validation,
            weather_summary=itinerary.weather_summary,
            metrics={
                "budget_breakdown": budget_summary["breakdown"],
                "cost_per_day": budget_summary["cost_per_day"]
            }
        )

        summary_msg = (
            f"Day {affected_day_num} successfully updated: replaced '{request.affected_activity}' "
            f"with '{replacement_place.name if replacement_place else ''}'. "
            f"{activities_preserved} activities preserved across all days with minimal disturbance."
        )

        return ReplanningResult(
            trip_id=itinerary.trip_id or 1,
            itinerary_id=itinerary.id or 1,
            event_type=request.event_type,
            reason=request.reason,
            old_activity=request.affected_activity,
            new_activity=replacement_place.name if replacement_place else "",
            affected_day=affected_day_num,
            activities_changed=activities_changed,
            activities_preserved=activities_preserved,
            updated_itinerary=new_itinerary_response,
            change_summary=summary_msg
        )

dynamic_replanner = DynamicReplanner()
