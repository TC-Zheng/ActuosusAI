from unittest.mock import patch

import pytest
from huggingface_hub import HfApi

from actuosus_ai.ai_model_manager.ai_model_download_service import (
    AIModelDownloadService,
)
from actuosus_ai.common.actuosus_exception import InternalException


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

    @pytest.mark.asyncio
    @patch("actuosus_ai.ai_model_manager.ai_model_download_service.HfApi")
    async def test_get_model_info(self, mock_hf_api, mocker):
        # Arrange
        mock_hf_api.return_value.list_models.return_value = [
            mocker.MagicMock(id="model1")
        ]
        model_name = "test_model"

        # Act
        result = await AIModelDownloadService.search_hub_with_name(model_name, 10)

        # Assert
        assert result == ["model1"]
        mock_hf_api.return_value.list_models.assert_called_once_with(
            search=model_name, limit=10
        )

    @pytest.mark.asyncio
    @patch("actuosus_ai.ai_model_manager.ai_model_download_service.HfApi")
    async def test_get_model_info_raises_internal_exception(self, mock_hf_api):
        # Arrange
        mock_hf_api.return_value.list_models.side_effect = Exception("Test exception")
        model_name = "test_model"

        # Act & Assert
        with pytest.raises(InternalException) as exc_info:
            await AIModelDownloadService.search_hub_with_name(model_name, 10)

        assert str(exc_info.value) == "Test exception"
        mock_hf_api.return_value.list_models.assert_called_once_with(
            search=model_name, limit=10
        )
