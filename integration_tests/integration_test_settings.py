from pydantic_settings import BaseSettings


class TestSettings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./test.db"
    base_file_storage_path: str = "test"


test_setting = TestSettings(
    database_url="sqlite+aiosqlite:///./test.db",
    base_file_storage_path="test",
)


def get_test_settings():
    return test_setting
