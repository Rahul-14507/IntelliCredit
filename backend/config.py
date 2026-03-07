import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    AZURE_OPENAI_ENDPOINT: str
    AZURE_OPENAI_API_KEY: str
    AZURE_OPENAI_DEPLOYMENT_NAME: str = "gpt-4o"
    AZURE_OPENAI_API_VERSION: str = "2024-02-01"
    
    AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT: str
    AZURE_DOCUMENT_INTELLIGENCE_KEY: str
    
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/intellicredit"
    UPLOAD_DIR: str = "./uploads"
    DEMO_MODE: bool = False
    CORS_ORIGINS: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        extra = "ignore"

def get_settings() -> Settings:
    try:
        return Settings()
    except Exception as e:
        print(f"Error loading configuration: {e}")
        raise ValueError("Missing required environment variables. Please check your .env file.")

# Single instances
settings = get_settings()
