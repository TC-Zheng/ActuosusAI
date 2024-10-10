from pydantic_settings import BaseSettings


class TestSettings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:////home/zhengt/Projects/test/test.db"
    base_file_storage_path: str = "/home/zhengt/Projects/test"


test_setting = TestSettings(
    database_url="sqlite+aiosqlite:////home/zhengt/Projects/test/test.db",
    base_file_storage_path="/home/zhengt/Projects/test",
)


def get_test_settings():
    return test_setting
