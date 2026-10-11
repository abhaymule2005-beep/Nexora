import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    preferences = relationship("Preference", back_populates="user", cascade="all, delete-orphan")
    trips = relationship("Trip", back_populates="user")


class Preference(Base):
    __tablename__ = "preferences"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    interest = Column(String(100), nullable=False)  # e.g., "beach", "history"
    weight = Column(Float, default=1.0)
    walking_tolerance = Column(String(50), default="moderate")  # "low", "moderate", "high"
    travel_style = Column(String(50), default="relaxed")        # "relaxed", "packed", "fast"
    food_preference = Column(String(50), default="any")         # "vegetarian", "seafood", "any"
    budget_level = Column(String(50), default="mid")            # "low", "mid", "luxury"
    transport_preference = Column(String(50), default="car")     # "walking", "cab", "public"

    user = relationship("User", back_populates="preferences")


class Place(Base):
    __tablename__ = "places"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(150), nullable=False, unique=True, index=True)
    destination = Column(String(100), default="Goa", index=True)
    category = Column(String(50), nullable=False, index=True)
    description = Column(Text, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    rating = Column(Float, default=4.0)
    cost = Column(Float, default=0.0)
    duration_minutes = Column(Integer, default=60)
    opening_time = Column(String(10), default="09:00")
    closing_time = Column(String(10), default="18:00")
    walking_level = Column(String(20), default="moderate")      # "low", "moderate", "high"
    weather_sensitivity = Column(String(20), default="low")     # "low", "moderate", "high"
    tags = Column(String(250), default="")                       # comma-separated tags

    activities = relationship("ItineraryActivity", back_populates="place")


class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    destination = Column(String(100), default="Goa", nullable=False)
    start_date = Column(String(20), nullable=True)
    end_date = Column(String(20), nullable=True)
    days = Column(Integer, default=3, nullable=False)
    budget = Column(Float, default=20000.0, nullable=False)
    travelers = Column(Integer, default=1)
    travel_style = Column(String(50), default="relaxed")
    walking_tolerance = Column(String(50), default="moderate")
    interests = Column(String(250), default="beach,history")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="trips")
    itineraries = relationship("Itinerary", back_populates="trip", cascade="all, delete-orphan")
    replanning_events = relationship("ReplanningEvent", back_populates="trip", cascade="all, delete-orphan")


class Itinerary(Base):
    __tablename__ = "itineraries"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    status = Column(String(50), default="active")  # "active", "draft", "replanned"
    total_cost = Column(Float, default=0.0)
    total_distance = Column(Float, default=0.0)    # km
    total_travel_time = Column(Float, default=0.0) # minutes
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    trip = relationship("Trip", back_populates="itineraries")
    activities = relationship("ItineraryActivity", back_populates="itinerary", cascade="all, delete-orphan")


class ItineraryActivity(Base):
    __tablename__ = "itinerary_activities"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    itinerary_id = Column(Integer, ForeignKey("itineraries.id"), nullable=False)
    day = Column(Integer, nullable=False)
    place_id = Column(Integer, ForeignKey("places.id"), nullable=False)
    start_time = Column(String(10), nullable=False) # e.g. "09:30"
    end_time = Column(String(10), nullable=False)   # e.g. "11:00"
    travel_time = Column(Integer, default=15)       # minutes from previous place
    estimated_cost = Column(Float, default=0.0)
    order_index = Column(Integer, default=0)
    reason = Column(String(250), default="")        # why selected / recommendation reason

    itinerary = relationship("Itinerary", back_populates="activities")
    place = relationship("Place", back_populates="activities")


class ReplanningEvent(Base):
    __tablename__ = "replanning_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    reason = Column(String(250), nullable=False)
    old_activity = Column(String(150), nullable=False)
    new_activity = Column(String(150), nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    trip = relationship("Trip", back_populates="replanning_events")
