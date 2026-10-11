import re
from typing import Dict, Any, List
from app.schemas.trip import ParsedTripRequirement
from app.config import settings
import httpx

def fallback_parse_trip_request(query: str) -> ParsedTripRequirement:
    """
    Deterministic rule-based parser extracting structured trip parameters
    from free-form natural language text.
    """
    text = query.lower()
    notes: List[str] = []

    # 1. Destination Extraction
    destination = "Goa"
    dest_matches = ["goa", "mumbai", "delhi", "kerala", "jaipur", "manali"]
    for dest in dest_matches:
        if dest in text:
            destination = dest.capitalize()
            break
    notes.append(f"Destination detected: {destination}")

    # 2. Duration / Days Extraction
    # Match patterns like: "5 day", "5 days", "3-day", "for 4 days", "a week"
    days = 3
    days_match = re.search(r'(\d+)\s*(?:day|days|d)', text)
    if days_match:
        days = min(14, max(1, int(days_match.group(1))))
        notes.append(f"Duration extracted: {days} days")
    elif "week" in text:
        days = 7
        notes.append("Duration extracted: 7 days (1 week)")
    elif "weekend" in text:
        days = 2
        notes.append("Duration extracted: 2 days (weekend)")

    # 3. Budget Extraction
    # Match patterns like: "40000", "₹40,000", "40k", "budget is 35000", "budget of 50000"
    budget = 25000.0
    k_match = re.search(r'(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*k\b', text)
    num_match = re.search(r'(?:₹|rs\.?|inr|budget|of|is)?\s*([1-9]\d{3,6})\b', text)
    
    if k_match:
        budget = float(k_match.group(1)) * 1000.0
        notes.append(f"Budget parsed: ₹{int(budget):,}")
    elif num_match:
        budget = float(num_match.group(1))
        notes.append(f"Budget parsed: ₹{int(budget):,}")

    # 4. Companions & Traveler Count
    companions: List[str] = []
    traveler_count = 1
    if "parents" in text:
        companions.append("parents")
        traveler_count = max(traveler_count, 3)
    if "family" in text:
        companions.append("family")
        traveler_count = max(traveler_count, 4)
    if "friends" in text:
        companions.append("friends")
        traveler_count = max(traveler_count, 3)
    if "couple" in text or "partner" in text or "wife" in text or "husband" in text:
        companions.append("couple")
        traveler_count = 2
    if "solo" in text or "myself" in text or "alone" in text:
        companions.append("solo")
        traveler_count = 1

    # Check for direct count e.g. "4 people", "2 travelers"
    people_match = re.search(r'(\d+)\s*(?:people|travelers|adults|persons|pax)', text)
    if people_match:
        traveler_count = int(people_match.group(1))

    # 5. Interests Extraction
    available_interests = [
        "beach", "history", "nature", "museum", "food", 
        "shopping", "culture", "entertainment", "nightlife"
    ]
    extracted_interests = []
    for interest in available_interests:
        if interest in text:
            extracted_interests.append(interest)
            
    # Synonym matching
    if "fort" in text or "church" in text or "heritage" in text or "historic" in text:
        if "history" not in extracted_interests:
            extracted_interests.append("history")
    if "sea" in text or "coastal" in text or "ocean" in text or "sand" in text:
        if "beach" not in extracted_interests:
            extracted_interests.append("beach")
    if "waterfall" in text or "wildlife" in text or "bird" in text or "trek" in text:
        if "nature" not in extracted_interests:
            extracted_interests.append("nature")
    if "seafood" in text or "dining" in text or "restaurant" in text or "cuisine" in text:
        if "food" not in extracted_interests:
            extracted_interests.append("food")
            
    if not extracted_interests:
        extracted_interests = ["beach", "history"] # sensible default

    # 6. Walking Tolerance Extraction
    walking_tolerance = "moderate"
    if "no walking" in text or "don't want too much walking" in text or "less walking" in text or "low walking" in text or "not much walking" in text:
        walking_tolerance = "low"
    elif "lots of walking" in text or "trekking" in text or "hiking" in text or "high walking" in text:
        walking_tolerance = "high"

    # 7. Travel Style
    travel_style = "relaxed"
    if "packed" in text or "fast" in text or "see everything" in text or "busy" in text:
        travel_style = "packed"
    elif "luxury" in text or "chill" in text or "relaxed" in text or "easy" in text:
        travel_style = "relaxed"

    return ParsedTripRequirement(
        destination=destination,
        days=days,
        budget=budget,
        traveler_count=traveler_count,
        companions=companions,
        interests=extracted_interests,
        walking_tolerance=walking_tolerance,
        travel_style=travel_style,
        food_preference="seafood" if "seafood" in text else "any",
        confidence=0.92,
        extracted_notes=notes
    )


def parse_trip_request(query: str) -> ParsedTripRequirement:
    """
    Main parser entrypoint. Uses OpenAI-compatible LLM if API key is configured,
    otherwise smoothly falls back to the deterministic NLP parser.
    """
    if settings.LLM_API_KEY and settings.LLM_BASE_URL:
        try:
            # We can invoke LLM provider
            import json
            prompt = f"""Extract travel planning parameters into strict JSON:
Text: "{query}"
Format:
{{
  "destination": "Goa",
  "days": 3,
  "budget": 25000,
  "traveler_count": 2,
  "companions": ["family"],
  "interests": ["beach", "history"],
  "walking_tolerance": "low",
  "travel_style": "relaxed",
  "food_preference": "any"
}}"""
            headers = {
                "Authorization": f"Bearer {settings.LLM_API_KEY}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": settings.LLM_MODEL,
                "messages": [
                    {"role": "system", "content": "You are a travel entity extractor returning valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.1
            }
            with httpx.Client(timeout=6.0) as client:
                res = client.post(f"{settings.LLM_BASE_URL}/chat/completions", headers=headers, json=payload)
                if res.status_code == 200:
                    content = res.json()["choices"][0]["message"]["content"]
                    # Extract JSON substring
                    match = re.search(r'\{.*\}', content, re.DOTALL)
                    if match:
                        data = json.loads(match.group(0))
                        return ParsedTripRequirement(
                            destination=data.get("destination", "Goa"),
                            days=int(data.get("days", 3)),
                            budget=float(data.get("budget", 25000.0)),
                            traveler_count=int(data.get("traveler_count", 2)),
                            companions=data.get("companions", []),
                            interests=data.get("interests", ["beach", "history"]),
                            walking_tolerance=data.get("walking_tolerance", "moderate"),
                            travel_style=data.get("travel_style", "relaxed"),
                            food_preference=data.get("food_preference", "any"),
                            confidence=0.98,
                            extracted_notes=["Extracted via Live LLM"]
                        )
        except Exception as e:
            print(f"[Nexora Parser Notice] LLM call fell back to deterministic parser: {e}")

    # Default robust fallback
    return fallback_parse_trip_request(query)
