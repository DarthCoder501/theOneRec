"""Application configuration."""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    google_api_key: str = ""
    cors_origins: str = "http://localhost:3000"
    artifacts_path: Path = Path(__file__).parent / "artifacts"
    guest_max_queries: int = 5
    guest_max_results: int = 3
    member_max_results: int = 10
    gemini_model_id: str = "gemini-2.0-flash"  # env: GEMINI_MODEL_ID
    # Full quality by default (Modal production uses 4GB RAM).
    enable_cross_encoder: bool = True  # env: ENABLE_CROSS_ENCODER
    preload_models: bool = True  # env: PRELOAD_MODELS

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
