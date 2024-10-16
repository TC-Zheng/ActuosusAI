from pathlib import Path

import pytest_asyncio
from huggingface_hub import model_info

from actuosus_ai.ai_model_manager.connection import get_async_db_session

import shutil

import pytest
from transformers import AutoModel, AutoTokenizer

from actuosus_ai.ai_model_manager.ai_model_storage_service import AIModelStorageService
from integration_tests.conftest import get_test_settings

DB_URL = "test.db"
BASE_STORAGE_PATH = "test"
MODEL_NAME_1 = "dslim/distilbert-NER"
MODEL_PIPELINE_TAG_1 = "token-classification"


class TestIntegrationAiModelManager:
    @classmethod
    def setup_class(cls):
        # clean up test directory
        shutil.rmtree(BASE_STORAGE_PATH, ignore_errors=True)
        Path(DB_URL).unlink(missing_ok=True)

    @classmethod
    def teardown_class(cls):
        # clean up test directory
        shutil.rmtree(BASE_STORAGE_PATH, ignore_errors=True)
        Path(DB_URL).unlink(missing_ok=True)

    @pytest.fixture
    def async_session(self):
        return get_async_db_session(get_test_settings())

    @pytest_asyncio.fixture
    async def ai_model_storage_service(self, async_session):
        async for session in get_async_db_session(get_test_settings()):
            return AIModelStorageService(get_test_settings(), session)

    @pytest.mark.asyncio
    async def test_integration_search_hugging_face(self, client):
        # Arrange
        name = MODEL_NAME_1[:-1]

        # Act
        response = client.get(f"/huggingface/search/{name}/")

        # Assert
        print(response.json())
        assert MODEL_NAME_1 in response.json()
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_integration_download_hf_lang_model(
        self, client, ai_model_storage_service
    ):
        # Arrange
        payload = {"hf_model_id": MODEL_NAME_1}

        # Act
        response = client.post("/download/hf_lang_model/", json=payload)

        # Assert
        assert response.json() == {
            "success": True,
            "message": "Model downloaded successfully",
        }
        assert response.status_code == 200

        # Check if the model info is saved in the database
        pipeline_tag = model_info(MODEL_NAME_1).pipeline_tag

        dtos = await ai_model_storage_service.get_models()
        assert len(dtos) == 1
        assert dtos[0].ai_model_id == 1
        assert dtos[0].name == MODEL_NAME_1
        assert dtos[0].pipeline_tag == pipeline_tag
        # Try to load the models
        AutoModel.from_pretrained(dtos[0].storage_path)
        AutoTokenizer.from_pretrained(dtos[0].storage_path)

    @pytest.mark.asyncio
    async def test_copy_model(self, client, ai_model_storage_service):
        # Arrange

        # Act
        client.post("/model/1/copy/")
        client.post("/model/1/copy/")
        client.post("/model/2", json={"name": "distilbert 2"})
        client.post(
            "/model/3",
            json={"name": "Checking for name match"},
        )

        # Assert
        assert len(await ai_model_storage_service.get_models()) == 3

    @pytest.mark.asyncio
    async def test_get_all_models(self, client):
        # Act
        response = client.get("/models/")
        dtos = response.json()["models"]

        # Assert
        assert len(dtos) == 3
        assert dtos[0]["name"] == MODEL_NAME_1
        assert dtos[1]["name"] == "distilbert 2"
        assert dtos[2]["name"] == "Checking for name match"

    @pytest.mark.asyncio
    async def test_get_models_limit_offset(self, client):
        # Act
        response = client.get("/models/?limit=2&offset=1")
        dtos = response.json()["models"]

        # Assert
        assert len(dtos) == 2
        assert dtos[0]["name"] == "distilbert 2"
        assert dtos[1]["name"] == "Checking for name match"

    @pytest.mark.asyncio
    async def test_get_models_filter_by_name(self, client):
        # Act
        response = client.get("/models/?name=distilbert")
        dtos = response.json()["models"]

        # Assert
        assert len(dtos) == 2
        assert dtos[0]["name"] == MODEL_NAME_1
        assert dtos[1]["name"] == "distilbert 2"

    @pytest.mark.asyncio
    async def test_get_models_filter_by_pipeline_tag(self, client):
        # Act
        response = client.get("/models/?pipeline_tag=token-classification")
        dtos = response.json()["models"]

        # Assert
        assert len(dtos) == 3

        # Act
        response = client.get("/models/?pipeline_tag=wrong tag")
        dtos = response.json()["models"]

        # Assert
        assert len(dtos) == 0

    @pytest.mark.asyncio
    async def test_get_models_order_by(self, client):
        # Act
        response = client.get("/models/?order_by=ai_model_id&is_desc=True")
        dtos = response.json()["models"]

        # Assert
        assert len(dtos) == 3
        assert dtos[0]["name"] == "Checking for name match"
        assert dtos[1]["name"] == "distilbert 2"
        assert dtos[2]["name"] == MODEL_NAME_1

    @pytest.mark.asyncio
    async def test_delete_model(self, client, ai_model_storage_service):
        # Arrange
        dto = await ai_model_storage_service.get_model_by_id(1)
        path = Path(dto.storage_path)

        # Act
        response = client.delete("/model/1")

        # Assert
        assert response.json() == {
            "success": True,
            "message": "Model deleted successfully",
        }
        assert len(await ai_model_storage_service.get_models()) == 2
        assert not path.exists()
