import os
import json
from pathlib import Path
from app.database.session import engine, SessionLocal, Base
from app.models.entities import Place, User, Preference

def find_seed_file() -> Path | None:
    current_dir = Path(__file__).resolve().parent
    candidates = [
        current_dir.parent.parent / "data" / "seed" / "places_goa.json",
        current_dir.parent.parent.parent / "data" / "seed" / "places_goa.json",
        Path("data/seed/places_goa.json"),
        Path("backend/data/seed/places_goa.json"),
        Path("../data/seed/places_goa.json"),
    ]
    for p in candidates:
        if p.exists():
            return p
    return None

def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_file = find_seed_file()
        if seed_file and seed_file.exists():
            with open(seed_file, "r", encoding="utf-8") as f:
                places_data = json.load(f)
            
            existing_names = {p.name.lower() for p in db.query(Place.name).all()}
            added_count = 0
            for item in places_data:
                if item["name"].lower() not in existing_names:
                    place = Place(
                        name=item["name"],
                        destination=item.get("destination", "Goa"),
                        category=item["category"],
                        description=item["description"],
                        latitude=item["latitude"],
                        longitude=item["longitude"],
                        rating=item.get("rating", 4.0),
                        cost=item.get("cost", 0.0),
                        duration_minutes=item.get("duration_minutes", 60),
                        opening_time=item.get("opening_time", "09:00"),
                        closing_time=item.get("closing_time", "18:00"),
                        walking_level=item.get("walking_level", "moderate"),
                        weather_sensitivity=item.get("weather_sensitivity", "low"),
                        tags=",".join(item.get("tags", [])) if isinstance(item.get("tags"), list) else str(item.get("tags", ""))
                    )
                    db.add(place)
                    existing_names.add(item["name"].lower())
                    added_count += 1
            db.commit()
            print(f"[Nexora DB] Synchronized database. Added {added_count} new places across destinations.")

        demo_user = db.query(User).filter_by(name="Demo Traveler").first()
        if not demo_user:
            demo_user = User(name="Demo Traveler")
            db.add(demo_user)
            db.commit()

    except Exception as e:
        db.rollback()
        print(f"[Nexora DB Error] Init error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
