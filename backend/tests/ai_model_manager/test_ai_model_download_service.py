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

    @pytest.fixture
    def mocked_settings(self, mocker):
        return mocker.MagicMock(base_storage_path="some path")

    @pytest.mark.asyncio
    @patch.object(HfApi, "model_info")
    @patch('actuosus_ai.ai_model_manager.ai_model_download_service.snapshot_download')
    async def test_download_hugging_face_lm_success(
        self,
        mocked_snapshot_download,
        mocked_model_info,
        mocker,
        mocked_ai_model_storage_service,
        mocked_settings,
    ):
        # Arrange
        model_name = "some_model_name"
        mocked_model_info.return_value = mocker.MagicMock(
            pipeline_tag="some pipeline value"
        )
        mocked_ai_model_storage_service.add_new_model.return_value = None
        service = AIModelDownloadService(mocked_ai_model_storage_service, mocked_settings)

        # Act
        await service.download_lm_from_hugging_face(model_name)

        # Assert
        mocked_snapshot_download.assert_called_once()
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
