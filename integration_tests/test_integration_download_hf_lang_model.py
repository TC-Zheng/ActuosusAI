from pathlib import Path

from huggingface_hub import model_info

from actuosus_ai.ai_model_manager.connection import get_async_db_session

import shutil

import pytest
from transformers import AutoModel, AutoTokenizer

from actuosus_ai.ai_model_manager.ai_model_storage_service import AIModelStorageService
from integration_tests.integration_test_settings import get_test_settings

DB_URL = "test.db"
BASE_STORAGE_PATH = "test"
MODEL_NAME_1 = "dslim/distilbert-NER"


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

    # Test by downloading a small bert model from hugging face then try to load it and check if it is saved in the database
    @pytest.mark.asyncio
    async def test_integration_download_hf_lang_model(self, client):
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

        async for session in get_async_db_session(get_test_settings()):
            ai_model_service = AIModelStorageService(get_test_settings(), session)
            dtos = await ai_model_service.get_models()
            assert len(dtos) == 1
            assert dtos[0].ai_model_id == 1
            assert dtos[0].name == MODEL_NAME_1
            assert dtos[0].pipeline_tag == pipeline_tag
            # Try to load the models
            AutoModel.from_pretrained(dtos[0].storage_path)
            AutoTokenizer.from_pretrained(dtos[0].storage_path)
