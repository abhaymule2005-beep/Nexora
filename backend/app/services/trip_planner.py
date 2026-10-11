from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.entities import Place, Trip, Itinerary, ItineraryActivity
from app.schemas.trip import (
    TripRequest, ItineraryResponse, DayPlan, ActivityResponse, PlaceResponse
)
from app.services.recommendation import recommendation_engine
from app.services.route_optimizer import route_optimizer
from app.services.scheduler import constraint_scheduler
from app.services.geo import calculate_route_metrics
from app.services.budget_engine import budget_engine
from app.services.weather import weather_service
from app.services.validator import itinerary_validator

class TripPlannerService:
    """
    Core orchestrator:
    UNDERSTAND -> RECOMMEND -> OPTIMIZE -> ROUTE -> VALIDATE
    """
    def generate_itinerary(
        self,
        db: Session,
        request: TripRequest,
        save_to_db: bool = True
    ) -> ItineraryResponse:
        # 1. Fetch available places for destination
        all_places = db.query(Place).filter(Place.destination.ilike(f"%{request.destination}%")).all()
        if not all_places:
            all_places = db.query(Place).all()

        # 2. Get top ranked candidates
        # For N days, we need ~ 3-4 places per day = N * 3.5 candidates
        target_candidate_count = min(len(all_places), max(6, request.days * 4))
        recommendations = recommendation_engine.get_recommendations(
            all_places, request, top_k=target_candidate_count
        )

        ranked_places = [db.query(Place).get(r.place.id) for r in recommendations if r.place.id]
        place_reasons = {r.place.id: (r.reasons[0] if r.reasons else "Recommended for you") for r in recommendations}

        # 3. Distribute candidates across days (geographic & thematic clustering)
        # Sort by latitude to group North Goa, Central Panaji, and South Goa
        ranked_places.sort(key=lambda p: p.latitude, reverse=True)

        activities_per_day = 3 if request.travel_style == "relaxed" else 4
        days_buckets: List[List[Place]] = [[] for _ in range(request.days)]

        for idx, place in enumerate(ranked_places):
            day_idx = idx % request.days
            if len(days_buckets[day_idx]) < activities_per_day:
                days_buckets[day_idx].append(place)

        # 4. Fetch Weather Forecast
        forecasts = weather_service.get_forecast(days=request.days)

        # 5. Route optimize and schedule each day
        day_plans: List[DayPlan] = []
        all_scheduled_places: List[Place] = []
        total_trip_dist = 0.0
        total_trip_time_min = 0.0

        for day_num in range(1, request.days + 1):
            candidates = days_buckets[day_num - 1]
            if not candidates:
                continue

            # Route optimization (2-opt TSP)
            ordered_places, route_metrics = route_optimizer.optimize_day_route(candidates)

            # Constraint scheduling (OR-Tools)
            scheduled = constraint_scheduler.schedule_day(ordered_places)

            day_acts: List[ActivityResponse] = []
            day_cost = 0.0
            day_dist, day_time = calculate_route_metrics(ordered_places)

            for act_data in scheduled:
                place_obj = act_data["place"]
                all_scheduled_places.append(place_obj)
                cost = float(place_obj.cost)
                day_cost += cost

                day_acts.append(ActivityResponse(
                    day=day_num,
                    order_index=act_data["order_index"],
                    start_time=act_data["start_time"],
                    end_time=act_data["end_time"],
                    travel_time=act_data["travel_time"],
                    estimated_cost=cost,
                    reason=place_reasons.get(place_obj.id, "Recommended highlight"),
                    place=PlaceResponse.from_orm(place_obj)
                ))

            total_trip_dist += day_dist
            total_trip_time_min += day_time

            day_forecast = forecasts[day_num - 1] if day_num - 1 < len(forecasts) else None

            day_plans.append(DayPlan(
                day=day_num,
                date=day_forecast.get("date") if day_forecast else None,
                activities=day_acts,
                day_cost=day_cost,
                day_distance_km=day_dist,
                day_travel_minutes=day_time,
                weather_forecast=day_forecast
            ))

        # 6. Budget Calculation
        budget_summary = budget_engine.calculate_budget(
            places=all_scheduled_places,
            total_distance_km=total_trip_dist,
            days=request.days,
            travelers=request.travelers,
            target_budget=request.budget
        )

        # 7. Validation
        validation = itinerary_validator.validate(
            days=day_plans,
            target_budget=request.budget,
            total_estimated_cost=budget_summary["total_estimated_cost"],
            walking_tolerance=request.walking_tolerance
        )

        # 8. Persist to DB if requested
        trip_id = None
        itinerary_id = None
        if save_to_db:
            trip_entity = Trip(
                destination=request.destination,
                days=request.days,
                budget=request.budget,
                travelers=request.travelers,
                travel_style=request.travel_style,
                walking_tolerance=request.walking_tolerance,
                interests=",".join(request.interests)
            )
            db.add(trip_entity)
            db.commit()
            db.refresh(trip_entity)
            trip_id = trip_entity.id

            itinerary_entity = Itinerary(
                trip_id=trip_id,
                status="active",
                total_cost=budget_summary["total_estimated_cost"],
                total_distance=round(total_trip_dist, 2),
                total_travel_time=total_trip_time_min
            )
            db.add(itinerary_entity)
            db.commit()
            db.refresh(itinerary_entity)
            itinerary_id = itinerary_entity.id

            for dp in day_plans:
                for act in dp.activities:
                    act_record = ItineraryActivity(
                        itinerary_id=itinerary_id,
                        day=dp.day,
                        place_id=act.place.id,
                        start_time=act.start_time,
                        end_time=act.end_time,
                        travel_time=act.travel_time,
                        estimated_cost=act.estimated_cost,
                        order_index=act.order_index,
                        reason=act.reason
                    )
                    db.add(act_record)
            db.commit()

        return ItineraryResponse(
            id=itinerary_id,
            trip_id=trip_id,
            destination=request.destination,
            days_count=request.days,
            total_cost=budget_summary["total_estimated_cost"],
            remaining_budget=budget_summary["remaining_budget"],
            budget_status=budget_summary["status"],
            total_distance_km=round(total_trip_dist, 2),
            total_travel_time_minutes=total_trip_time_min,
            status="active",
            days=day_plans,
            validation=validation,
            weather_summary={"forecasts": forecasts},
            metrics={
                "budget_breakdown": budget_summary["breakdown"],
                "cost_per_day": budget_summary["cost_per_day"],
                "total_places": len(all_scheduled_places)
            }
        )

trip_planner_service = TripPlannerService()
