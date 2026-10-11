from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# Place Schemas
class PlaceBase(BaseModel):
    name: str
    destination: str = "Goa"
    category: str
    description: str
    latitude: float
    longitude: float
    rating: float = 4.0
    cost: float = 0.0
    duration_minutes: int = 60
    opening_time: str = "09:00"
    closing_time: str = "18:00"
    walking_level: str = "moderate"
    weather_sensitivity: str = "low"
    tags: str = ""

class PlaceCreate(PlaceBase):
    pass

class PlaceResponse(PlaceBase):
    id: int

    class Config:
        from_attributes = True


# Preference Schemas
class PreferenceSchema(BaseModel):
    interest: str
    weight: float = 1.0
    walking_tolerance: str = "moderate"
    travel_style: str = "relaxed"
    food_preference: str = "any"
    budget_level: str = "mid"
    transport_preference: str = "car"


# Trip Request Schemas
class TripRequest(BaseModel):
    destination: str = Field(default="Goa", description="Target travel destination")
    days: int = Field(default=3, ge=1, le=14, description="Trip duration in days")
    budget: float = Field(default=25000.0, ge=1000.0, description="Total budget in INR")
    travelers: int = Field(default=2, ge=1, description="Number of travelers")
    companions: Optional[List[str]] = Field(default_factory=list, description="Travel companions (e.g. parents, family, friends, solo)")
    interests: List[str] = Field(default_factory=lambda: ["beach", "history"], description="List of preferred interests")
    walking_tolerance: str = Field(default="moderate", description="low, moderate, high")
    travel_style: str = Field(default="relaxed", description="relaxed, packed, fast")
    food_preference: Optional[str] = "any"
    start_date: Optional[str] = None
    natural_language_query: Optional[str] = None


class NaturalLanguageRequest(BaseModel):
    query: str


class ParsedTripRequirement(BaseModel):
    destination: str
    days: int
    budget: float
    traveler_count: int
    companions: List[str]
    interests: List[str]
    walking_tolerance: str
    travel_style: str
    food_preference: Optional[str] = "any"
    confidence: float = 1.0
    extracted_notes: List[str] = []


# Recommendation Schemas
class RecommendationItem(BaseModel):
    place: PlaceResponse
    score: float
    reasons: List[str]


# Itinerary Activity Schemas
class ActivityResponse(BaseModel):
    id: Optional[int] = None
    day: int
    order_index: int
    start_time: str
    end_time: str
    travel_time: int # minutes
    estimated_cost: float
    reason: str
    place: PlaceResponse


class DayPlan(BaseModel):
    day: int
    date: Optional[str] = None
    activities: List[ActivityResponse]
    day_cost: float
    day_distance_km: float
    day_travel_minutes: float
    weather_forecast: Optional[Dict[str, Any]] = None


# Validation Schemas
class ValidationIssue(BaseModel):
    type: str # e.g. "overlap", "opening_hours", "budget", "weather", "fatigue"
    severity: str # "critical", "warning", "info"
    message: str
    day: Optional[int] = None
    place_name: Optional[str] = None
    suggested_fix: Optional[str] = None


class ValidationResult(BaseModel):
    valid: bool
    score: float = 1.0
    issues: List[ValidationIssue] = []
    warnings: List[ValidationIssue] = []
    summary: Dict[str, Any] = {}


# Itinerary Response
class ItineraryResponse(BaseModel):
    id: Optional[int] = None
    trip_id: Optional[int] = None
    destination: str
    days_count: int
    total_cost: float
    remaining_budget: float
    budget_status: str # "Within budget" or "Budget exceeded"
    total_distance_km: float
    total_travel_time_minutes: float
    status: str
    days: List[DayPlan]
    validation: Optional[ValidationResult] = None
    weather_summary: Optional[Dict[str, Any]] = None
    metrics: Optional[Dict[str, Any]] = None


# Dynamic Replanning & Simulation Schemas
class ReplanRequest(BaseModel):
    event_type: str # "weather_change", "budget_cut", "attraction_closed", "manual_remove"
    day: int
    affected_activity: str # name of place
    reason: str
    new_budget: Optional[float] = None


class ReplanningResult(BaseModel):
    trip_id: int
    itinerary_id: int
    event_type: str
    reason: str
    old_activity: str
    new_activity: str
    affected_day: int
    activities_changed: int
    activities_preserved: int
    updated_itinerary: ItineraryResponse
    change_summary: str


class SimulationRequest(BaseModel):
    scenario_type: str # "weather_change", "budget_cut", "attraction_closed", "time_delay"
    day: Optional[int] = 1
    affected_activity: Optional[str] = None
    budget_delta: Optional[float] = None
    weather_condition: Optional[str] = "Heavy rain"


class SimulationResponse(BaseModel):
    scenario: str
    impact_description: str
    original_itinerary: ItineraryResponse
    updated_itinerary: ItineraryResponse
    activities_changed_count: int
    activities_preserved_count: int
    cost_difference: float
    distance_difference_km: float
