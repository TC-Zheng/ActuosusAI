from typing import Optional

from dotenv import load_dotenv
from huggingface_hub import login
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    base_file_storage_path: str
    debug_mode: bool
    huggingface_token: Optional[str] = None

    class Config:
        env_file = ".env"


load_dotenv(override=True)
settings = Settings()  # type: ignore
if settings.huggingface_token and settings.huggingface_token.strip():
    login(settings.huggingface_token)


def get_settings() -> Settings:
    return settings
