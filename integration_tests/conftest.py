import pytest
from starlette.testclient import TestClient

from actuosus_ai.app.main import app
from actuosus_ai.common.settings import get_settings
from integration_tests.integration_test_settings import get_test_settings


@pytest.fixture
def client():
    client = TestClient(app)
    app.dependency_overrides[get_settings] = get_test_settings
    return client
