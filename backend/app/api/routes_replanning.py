from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.entities import Trip, Itinerary
from app.schemas.trip import (
    ReplanRequest, ReplanningResult, SimulationRequest, SimulationResponse, ItineraryResponse
)
from app.api.routes_trips import get_trip_itinerary
from app.services.replanner import dynamic_replanner
from app.services.simulator import what_if_simulator

router = APIRouter(prefix="/trips", tags=["Dynamic Replanning & Simulation"])

@router.post("/{trip_id}/replan", response_model=ReplanningResult)
def replan_trip(trip_id: int, request: ReplanRequest, db: Session = Depends(get_db)):
    """
    Signature minimal-change dynamic replanning:
    Replaces affected activity while freezing all other days and activities intact.
    """
    itinerary_res = get_trip_itinerary(trip_id, db)
    return dynamic_replanner.replan(db, itinerary_res, request)

@router.post("/{trip_id}/simulate", response_model=SimulationResponse)
def simulate_trip_scenario(trip_id: int, request: SimulationRequest, db: Session = Depends(get_db)):
    """
    What-if simulation:
    Previews the impact of weather events, attraction closures, or budget cuts.
    """
    itinerary_res = get_trip_itinerary(trip_id, db)
    return what_if_simulator.simulate(db, itinerary_res, request)

@router.post("/replan-live", response_model=ReplanningResult)
def replan_live(itinerary: ItineraryResponse, request: ReplanRequest, db: Session = Depends(get_db)):
    """
    Live frontend replanning supporting transient in-memory itineraries.
    """
    return dynamic_replanner.replan(db, itinerary, request)

@router.post("/simulate-live", response_model=SimulationResponse)
def simulate_live(itinerary: ItineraryResponse, request: SimulationRequest, db: Session = Depends(get_db)):
    """
    Live frontend what-if simulation supporting transient in-memory itineraries.
    """
    return what_if_simulator.simulate(db, itinerary, request)
