import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.geo import haversine_distance_km, calculate_route_metrics
from app.services.scheduler import parse_time_str_to_minutes, minutes_to_time_str
from app.services.parser import fallback_parse_trip_request

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["project"] == "Nexora"

def test_get_destinations_and_places():
    dest_res = client.get("/destinations")
    assert dest_res.status_code == 200
    assert len(dest_res.json()["destinations"]) >= 1

    places_res = client.get("/places")
    assert places_res.status_code == 200
    places = places_res.json()
    assert len(places) >= 30

def test_natural_language_parser():
    query = "I want a relaxed 5 day Goa trip with my parents. My budget is 40000. We like beaches and historical places. We don't want too much walking."
    parsed = fallback_parse_trip_request(query)
    assert parsed.destination == "Goa"
    assert parsed.days == 5
    assert parsed.budget == 40000.0
    assert "parents" in parsed.companions
    assert "beach" in parsed.interests
    assert "history" in parsed.interests
    assert parsed.walking_tolerance == "low"
    assert parsed.travel_style == "relaxed"

def test_haversine_distance():
    # Fort Aguada to Baga Beach is ~7-9 km
    dist = haversine_distance_km(15.4923, 73.7738, 15.5553, 73.7516)
    assert 6.0 <= dist <= 12.0

def test_time_conversions():
    assert parse_time_str_to_minutes("09:30") == 570
    assert minutes_to_time_str(570) == "09:30"
    assert minutes_to_time_str(1020) == "17:00"

def test_recommendations():
    payload = {
        "destination": "Goa",
        "days": 3,
        "budget": 25000,
        "travelers": 2,
        "interests": ["beach", "history"],
        "walking_tolerance": "low",
        "travel_style": "relaxed"
    }
    response = client.post("/recommendations?top_k=8", json=payload)
    assert response.status_code == 200
    recs = response.json()
    assert len(recs) == 8
    assert recs[0]["score"] > 0
    assert len(recs[0]["reasons"]) > 0

def test_trip_generation_and_validation():
    payload = {
        "destination": "Goa",
        "days": 3,
        "budget": 30000,
        "travelers": 2,
        "interests": ["beach", "history"],
        "walking_tolerance": "low",
        "travel_style": "relaxed"
    }
    response = client.post("/trips/generate", json=payload)
    assert response.status_code == 200
    itinerary = response.json()
    assert itinerary["days_count"] == 3
    assert len(itinerary["days"]) == 3
    assert itinerary["validation"]["valid"] is True
    assert itinerary["total_cost"] > 0
    assert itinerary["total_distance_km"] > 0

    # Test dynamic replanning on this generated trip
    trip_id = itinerary["trip_id"]
    replan_payload = {
        "event_type": "weather_change",
        "day": 2,
        "affected_activity": itinerary["days"][1]["activities"][0]["place"]["name"],
        "reason": "Heavy monsoon rains"
    }
    replan_res = client.post(f"/trips/{trip_id}/replan", json=replan_payload)
    assert replan_res.status_code == 200
    replan_data = replan_res.json()
    assert replan_data["affected_day"] == 2
    assert replan_data["activities_changed"] >= 1
    assert replan_data["activities_preserved"] > 0

def test_evaluation_benchmark():
    res = client.get("/evaluation/benchmark")
    assert res.status_code == 200
    data = res.json()
    assert "recommendation_metrics" in data
    assert "precision_at_5" in data["recommendation_metrics"]
    assert "ndcg_at_5" in data["recommendation_metrics"]
    assert "baseline_comparison" in data
