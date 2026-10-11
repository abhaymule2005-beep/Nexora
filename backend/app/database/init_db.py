import os
import json
from pathlib import Path
from app.database.session import engine, SessionLocal, Base
from app.models.entities import Place, User, Preference

def init_db():
    # 1. Create tables
    Base.metadata.create_all(bind=engine)
    
    # 2. Seed Places
    db = SessionLocal()
    try:
        existing_count = db.query(Place).count()
        if existing_count == 0:
            # Locate seed file
            current_file = Path(__file__).resolve()
            seed_file = current_file.parents[3] / "data" / "seed" / "places_goa.json"
            
            if not seed_file.exists():
                # Fallback location
                seed_file = Path("data/seed/places_goa.json")
            
            if seed_file.exists():
                with open(seed_file, "r", encoding="utf-8") as f:
                    places_data = json.load(f)
                
                for item in places_data:
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
                db.commit()
                print(f"[Nexora DB] Successfully seeded {len(places_data)} places into database.")
            else:
                print(f"[Nexora DB Warning] Seed file not found at {seed_file}")
        else:
            print(f"[Nexora DB] Database already contains {existing_count} places.")
            
        # Ensure a default demo user exists
        demo_user = db.query(User).filter_by(name="Demo Traveler").first()
        if not demo_user:
            demo_user = User(name="Demo Traveler")
            db.add(demo_user)
            db.commit()
            
    except Exception as e:
        db.rollback()
        print(f"[Nexora DB Error] Database initialization failed: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
