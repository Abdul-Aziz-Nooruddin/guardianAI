from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/guardian_db"
    qdrant_host: str = "localhost"
    qdrant_port: int = 6333
    groq_api_key: str = ""
    ollama_host: str = "http://localhost:11434"
    jwt_secret: str = ""
    jwt_algorithm: str = "HS256"

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env", "backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

settings = Settings()