from unittest.mock import patch, ANY

import pytest
from huggingface_hub import HfApi

from actuosus_ai.ai_model_manager.ai_model_download_service import (
    AIModelDownloadService,
)


class TestAIModelDownloadService:
    @pytest.fixture
    def mocked_ai_model_storage_service(self, mocker):
        return mocker.AsyncMock()

    @pytest.mark.asyncio
    @patch.object(HfApi, "model_info")
    @patch("transformers.AutoTokenizer.from_pretrained")
    @patch("transformers.AutoModel.from_pretrained")
    async def test_download_hugging_face_lm_success(
        self,
        mocked_auto_model,
        mocked_auto_tokenizer,
        mocked_model_info,
        mocker,
        mocked_ai_model_storage_service,
    ):
        # Arrange
        model_name = "some_model_name"
        storage_path = "some storage path"
        mocked_model_info.return_value = mocker.MagicMock(
            pipeline_tag="some pipeline value"
        )
        mocked_ai_model_storage_service.add_new_model.return_value = None
        service = AIModelDownloadService(mocked_ai_model_storage_service)

        # Act
        await service.download_lm_from_hugging_face(model_name)

        # Assert
        mocked_auto_model.assert_called_once_with(model_name)
        mocked_auto_tokenizer.assert_called_once_with(model_name)
        mocked_ai_model_storage_service.add_new_model.assert_called_once()

    @pytest.mark.asyncio
    @patch.object(HfApi, "model_info")
    @patch("transformers.AutoTokenizer.from_pretrained")
    @patch("transformers.AutoModel.from_pretrained")
    async def test_download_hugging_face_lm_default_path_success(
        self,
        mocked_auto_model,
        mocked_auto_tokenizer,
        mocked_model_info,
        mocker,
        mocked_ai_model_storage_service,
    ):
        # Arrange
        model_name = "some_model_name"
        mocked_model_info.return_value = mocker.MagicMock(
            pipeline_tag="some pipeline value"
        )
        mocked_ai_model_storage_service.add_new_model.return_value = None
        service = AIModelDownloadService(mocked_ai_model_storage_service)

        # Act
        await service.download_lm_from_hugging_face(model_name)

        # Assert
        mocked_auto_model.assert_called_once_with(model_name)
        mocked_auto_tokenizer.assert_called_once_with(model_name)
        mocked_ai_model_storage_service.add_new_model.assert_called_once()
