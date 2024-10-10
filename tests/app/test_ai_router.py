import pytest
from starlette.testclient import TestClient

from actuosus_ai.app.dependency import get_ai_download_service
from actuosus_ai.app.main import app


class TestAIRouter:
    @pytest.fixture(scope="class")
    def client(self):
        return TestClient(app)

    def test_download_lm_from_hugging_face(self, mocker, client):
        mock_service = mocker.AsyncMock()
        mock_service.download_lm_from_hugging_face.return_value = None
        app.dependency_overrides[get_ai_download_service] = lambda: mock_service
        response = client.post(
            "/download/hf_lang_model/",
            json={"hf_model_id": "gpt2"},
        )
        assert response.status_code == 200
        assert response.json() == {
            "success": True,
            "message": "Model downloaded successfully",
        }
