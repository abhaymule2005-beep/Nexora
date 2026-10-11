from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.entities import Place
from app.schemas.trip import PlaceResponse, RecommendationItem, TripRequest
from app.services.recommendation import recommendation_engine

router = APIRouter(tags=["Places & Destinations"])

@router.get("/destinations")
def get_destinations(db: Session = Depends(get_db)):
    # Distinct destinations in database
    unique_dests = [d[0] for d in db.query(Place.destination).distinct().all()]
    if not unique_dests:
        unique_dests = ["Goa", "Jaipur", "Kerala", "Mumbai", "Manali"]

    return {
        "destinations": [
            {
                "name": name,
                "country": "India"
            }
            for name in unique_dests
        ]
    }

@router.get("/places", response_model=List[PlaceResponse])
def get_places(
    category: Optional[str] = None,
    walking_level: Optional[str] = None,
    destination: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Place)
    if destination:
        query = query.filter(Place.destination.ilike(f"%{destination}%"))
    if category:
        query = query.filter(Place.category.ilike(f"%{category}%"))
    if walking_level:
        query = query.filter(Place.walking_level == walking_level)
    return query.all()

@router.post("/recommendations", response_model=List[RecommendationItem])
def get_recommendations(
    request: TripRequest,
    top_k: int = Query(default=12, ge=1, le=50),
    db: Session = Depends(get_db)
):
    places = db.query(Place).filter(Place.destination.ilike(f"%{request.destination}%")).all()
    if not places:
        places = db.query(Place).all()
    return recommendation_engine.get_recommendations(places, request, top_k=top_k)
