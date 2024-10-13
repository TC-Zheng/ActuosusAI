from datetime import datetime

import pytest
from starlette.testclient import TestClient

from actuosus_ai.ai_model_manager.dto import AIModelDTO
from actuosus_ai.app.dependency import (
    get_ai_download_service,
    get_ai_model_storage_service,
)
from actuosus_ai.app.main import app


class TestAIRouter:
    @pytest.fixture(scope="class")
    def client(self):
        return TestClient(app)

    @pytest.fixture
    def example_dto(self):
        return AIModelDTO(
            ai_model_id=1,
            name="some name 1",
            storage_path="some storage path 1",
            pipeline_tag="some pipeline tag 1",
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )

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

    def test_download_lm_from_hugging_face_invalid_model(self, mocker, client):
        mock_service = mocker.AsyncMock()
        mock_service.download_lm_from_hugging_face.side_effect = Exception(
            "Invalid model"
        )
        app.dependency_overrides[get_ai_download_service] = lambda: mock_service
        response = client.post(
            "/download/hf_lang_model/",
            json={"hf_model_id": "invalid_model"},
        )
        assert response.status_code == 500
        assert response.json() == {"message": "Invalid model", "success": False}

    def test_download_lm_from_hugging_face_no_payload(self, mocker, client):
        response = client.post(
            "/download/hf_lang_model/",
            json={},
        )
        assert response.status_code == 422

    def test_copy_model(self, mocker, client):
        mock_service = mocker.AsyncMock()
        mock_service.copy_model_by_id.return_value = None
        app.dependency_overrides[get_ai_model_storage_service] = lambda: mock_service
        response = client.post("/model/1/copy/")

        assert response.status_code == 200
        assert response.json() == {
            "success": True,
            "message": "Model copied successfully",
        }

    def test_edit_model_name(self, mocker, client, example_dto):
        mock_service = mocker.AsyncMock()
        mock_service.get_model_by_id.return_value = example_dto
        mock_service.update_model.return_value = None
        app.dependency_overrides[get_ai_model_storage_service] = lambda: mock_service
        response = client.post(
            "/model/1",
            json={"name": "new name"},
        )
        assert response.json() == {
            "success": True,
            "message": "Model name edited successfully",
        }
        assert response.status_code == 200

    def test_delete_model(self, mocker, client, example_dto):
        mock_service = mocker.AsyncMock()
        mock_service.get_model_by_id.return_value = example_dto
        mock_service.delete_model_by_id.return_value = None
        app.dependency_overrides[get_ai_model_storage_service] = lambda: mock_service
        response = client.delete(
            "/model/1",
        )
        assert response.status_code == 200
        assert response.json() == {"success": True, "message": "Model deleted successfully"}


    def test_edit_model_name_no_model(self, mocker, client):
        mock_service = mocker.AsyncMock()
        mock_service.get_model_by_id.return_value = None
        app.dependency_overrides[get_ai_model_storage_service] = lambda: mock_service
        response = client.post(
            "/model/1",
            json={"new_name": "new name"},
        )
        assert response.status_code == 404
        assert response.json() == {"message": "Model not found", "success": False}


    def test_get_models_no_query(self, mocker, client, example_dto):
        mock_service = mocker.AsyncMock()
        mock_service.get_models.return_value = [example_dto]
        app.dependency_overrides[get_ai_model_storage_service] = lambda: mock_service
        response = client.get(
            "/models/",
        )
        assert response.status_code == 200
        assert response.json() == {
            "models": [
                {
                    "ai_model_id": 1,
                    "name": "some name 1",
                    "pipeline_tag": "some pipeline tag 1",
                    "created_at": example_dto.created_at.isoformat(),
                    "updated_at": example_dto.updated_at.isoformat(),
                }
            ]
        }

    def test_get_models(self, mocker, client, example_dto):
        mock_service = mocker.AsyncMock()
        mock_service.get_models.return_value = [example_dto]
        app.dependency_overrides[get_ai_model_storage_service] = lambda: mock_service
        response = client.get(
            "/models/?limit=1&offset=0&name=some name 1&pipeline_tag=some pipeline tag 1&order_by=created_at&is_desc=True",
        )
        assert response.status_code == 200
        assert response.json() == {
            "models": [
                {
                    "ai_model_id": 1,
                    "name": "some name 1",
                    "pipeline_tag": "some pipeline tag 1",
                    "created_at": example_dto.created_at.isoformat(),
                    "updated_at": example_dto.updated_at.isoformat(),
                }
            ]
        }
