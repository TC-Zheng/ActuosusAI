import pytest
from starlette.testclient import TestClient

from actuosus_ai.app.main import app
from actuosus_ai.common.settings import get_settings
from pydantic_settings import BaseSettings


class TestSettings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./test.db"
    base_file_storage_path: str = "test"
    debug_mode: bool = False


test_setting = TestSettings(
    database_url="sqlite+aiosqlite:///./test.db",
    base_file_storage_path="test",
    debug_mode=False,
)


def get_test_settings():
    return test_setting


@pytest.fixture
def client():
    client = TestClient(app)
    app.dependency_overrides[get_settings] = get_test_settings
    return client
