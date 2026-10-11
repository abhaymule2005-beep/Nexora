from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.entities import Trip, Itinerary, Place
from app.schemas.trip import (
    TripRequest, NaturalLanguageRequest, ParsedTripRequirement,
    ItineraryResponse, DayPlan, ActivityResponse, PlaceResponse, ValidationResult
)
from app.services.parser import parse_trip_request
from app.services.trip_planner import trip_planner_service
from app.services.validator import itinerary_validator
from app.services.weather import weather_service

router = APIRouter(prefix="/trips", tags=["Trips"])

@router.post("/parse", response_model=ParsedTripRequirement)
def parse_trip(req: NaturalLanguageRequest):
    return parse_trip_request(req.query)

@router.post("/generate-basic", response_model=ItineraryResponse)
def generate_basic_trip(request: TripRequest, db: Session = Depends(get_db)):
    """
    Phase 3: Basic deterministic trip generator.
    """
    return trip_planner_service.generate_itinerary(db, request, save_to_db=True)

@router.post("/generate", response_model=ItineraryResponse)
def generate_trip(request: TripRequest, db: Session = Depends(get_db)):
    """
    Phase 7 & 8: Full Intelligent Optimizer Pipeline:
    NL parsing (if text provided) -> Hybrid Rec -> OR-Tools Scheduling -> 2-Opt Route -> Weather -> Validator.
    """
    if request.natural_language_query:
        parsed = parse_trip_request(request.natural_language_query)
        # Overlay extracted parameters if not overridden
        request.destination = parsed.destination
        request.days = parsed.days
        request.budget = parsed.budget
        request.travelers = parsed.traveler_count
        request.interests = parsed.interests
        request.walking_tolerance = parsed.walking_tolerance
        request.travel_style = parsed.travel_style

    return trip_planner_service.generate_itinerary(db, request, save_to_db=True)

@router.get("/{trip_id}", response_model=ItineraryResponse)
def get_trip_itinerary(trip_id: int, db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    itinerary = db.query(Itinerary).filter(Itinerary.trip_id == trip_id).order_by(Itinerary.id.desc()).first()
    if not itinerary:
        raise HTTPException(status_code=404, detail="Itinerary not found for trip")

    # Reconstruct DayPlans from DB activities
    day_buckets: dict[int, list] = {}
    for act in itinerary.activities:
        day_buckets.setdefault(act.day, []).append(act)

    day_plans = []
    for day_num in sorted(day_buckets.keys()):
        acts_in_day = sorted(day_buckets[day_num], key=lambda a: a.order_index)
        act_responses = [
            ActivityResponse(
                id=a.id,
                day=a.day,
                order_index=a.order_index,
                start_time=a.start_time,
                end_time=a.end_time,
                travel_time=a.travel_time,
                estimated_cost=a.estimated_cost,
                reason=a.reason or "Scheduled activity",
                place=PlaceResponse.from_orm(a.place)
            )
            for a in acts_in_day
        ]
        day_plans.append(DayPlan(
            day=day_num,
            activities=act_responses,
            day_cost=sum(a.estimated_cost for a in act_responses),
            day_distance_km=15.0, # approximate
            day_travel_minutes=45.0
        ))

    validation = itinerary_validator.validate(
        days=day_plans,
        target_budget=trip.budget,
        total_estimated_cost=itinerary.total_cost
    )

    return ItineraryResponse(
        id=itinerary.id,
        trip_id=trip.id,
        destination=trip.destination,
        days_count=trip.days,
        total_cost=itinerary.total_cost,
        remaining_budget=max(0.0, trip.budget - itinerary.total_cost),
        budget_status="Within budget" if itinerary.total_cost <= trip.budget else "Budget exceeded",
        total_distance_km=itinerary.total_distance,
        total_travel_time_minutes=itinerary.total_travel_time,
        status=itinerary.status,
        days=day_plans,
        validation=validation
    )

@router.post("/{trip_id}/validate", response_model=ValidationResult)
def validate_trip(trip_id: int, db: Session = Depends(get_db)):
    itinerary_res = get_trip_itinerary(trip_id, db)
    trip = db.query(Trip).get(trip_id)
    return itinerary_validator.validate(
        days=itinerary_res.days,
        target_budget=trip.budget if trip else 25000.0,
        total_estimated_cost=itinerary_res.total_cost
    )

@router.get("/{trip_id}/weather")
def get_trip_weather(trip_id: int, db: Session = Depends(get_db)):
    trip = db.query(Trip).get(trip_id)
    days_count = trip.days if trip else 5
    return {
        "trip_id": trip_id,
        "destination": trip.destination if trip else "Goa",
        "forecasts": weather_service.get_forecast(days=days_count)
    }
