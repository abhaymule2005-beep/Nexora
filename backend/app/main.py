from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database.init_db import init_db
from app.api.routes_health import router as health_router
from app.api.routes_places import router as places_router
from app.api.routes_trips import router as trips_router
from app.api.routes_replanning import router as replanning_router
from app.api.routes_evaluation import router as evaluation_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database and seed data on startup
    init_db()
    yield

app = FastAPI(
    title=settings.APP_NAME,
    description="Nexora AI Travel Planning and Dynamic Replanning System",
    version="1.0.0",
    lifespan=lifespan
)

# Enable permissive CORS for Vercel, localhost, and mobile clients
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health_router)
app.include_router(places_router)
app.include_router(trips_router)
app.include_router(replanning_router)
app.include_router(evaluation_router)

@app.get("/")
def root():
    return {
        "message": "Welcome to Nexora AI Travel Planning Engine",
        "docs": "/docs",
        "health": "/health"
    }
