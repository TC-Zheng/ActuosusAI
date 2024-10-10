from actuosus_ai.ai_model_manager.connection import get_async_db_session

import shutil

import pytest
from transformers import AutoModel, AutoTokenizer

from actuosus_ai.ai_model_manager.language_model_service import LanguageModelService
from integration_tests.integration_test_settings import get_test_settings


class TestIntegrationAiModelManager:
    @classmethod
    def setup_class(cls):
        # clean up test directory
        shutil.rmtree("/home/zhengt/Projects/test", ignore_errors=True)

    # Test by downloading a small bert model from hugging face then try to load it and check if it is saved in the database
    @pytest.mark.asyncio
    async def test_integration_download_hf_lang_model(self, client):
        # Arrange

        payload = {"hf_model_id": "dslim/distilbert-NER"}

        # Act
        response = client.post("/download/hf_lang_model/", json=payload)

        # Assert
        assert response.json() == {
            "success": True,
            "message": "Model downloaded successfully",
        }
        assert response.status_code == 200
        # Try to load the models
        AutoModel.from_pretrained("/home/zhengt/Projects/test/dslim/distilbert-NER")
        AutoTokenizer.from_pretrained("/home/zhengt/Projects/test/dslim/distilbert-NER")
        # Check if the model info is saved in the database
        async for session in get_async_db_session(get_test_settings()):
            language_model_service = LanguageModelService(session)
            dtos = await language_model_service.get_all_models()
            assert len(dtos) == 1
            assert dtos[0].lm_id == 1
            assert dtos[0].name == "dslim/distilbert-NER"
            assert (
                dtos[0].storage_path
                == "/home/zhengt/Projects/test/dslim/distilbert-NER"
            )
