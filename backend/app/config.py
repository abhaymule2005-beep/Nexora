import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_ENV: str = "development"
    APP_NAME: str = "Nexora"
    PORT: int = 8000
    DEBUG: bool = True
    DATABASE_URL: str = "sqlite:///./nexora.db"
    
    # Optional LLM Integration
    LLM_API_KEY: str = ""
    LLM_MODEL: str = "gpt-4o-mini"
    LLM_BASE_URL: str = "https://api.openai.com/v1"
    
    # Optional External APIs
    GEOAPIFY_API_KEY: str = ""
    WEATHER_PROVIDER: str = "open_meteo"

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
