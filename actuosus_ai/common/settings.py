from dotenv import load_dotenv
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    base_file_storage_path: str

    class Config:
        env_file = ".env"


load_dotenv(override=True)
settings = Settings()  # type: ignore


def get_settings() -> Settings:
    return settings
