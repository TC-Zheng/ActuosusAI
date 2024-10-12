from datetime import datetime
from unittest.mock import patch

import pytest

from actuosus_ai.ai_model_manager.dto import AIModelDTO, CreateNewAIModelDTO
from actuosus_ai.ai_model_manager.ai_model_storage_service import AIModelStorageService
from actuosus_ai.ai_model_manager.orm import AIModelORM
from actuosus_ai.common.actuosus_exception import InternalException


class TestAIModelStorageService:
    @pytest.fixture
    def mocked_settings(self, mocker):
        mock = mocker.MagicMock()
        mock.base_file_storage_path = "example_path"
        return mock

    @pytest.fixture
    def mocked_async_session(self, mocker):
        return mocker.AsyncMock()

    @pytest.fixture
    def mocked_model(self, mocker):
        return mocker.MagicMock()

    @pytest.fixture
    def mocked_tokenizer(self, mocker):
        return mocker.MagicMock()

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

    @pytest.fixture
    def example_create_model_dto(self):
        return CreateNewAIModelDTO(
            name="some name 1",
            storage_path="some storage path 1",
            pipeline_tag="some pipeline tag 1",
        )

    @pytest.mark.asyncio
    @patch("shutil.move")
    async def test_add_new_model_success(
        self,
        mocked_move,
        mocked_settings,
        mocked_async_session,
        mocked_model,
        mocked_tokenizer,
        example_create_model_dto,
    ):
        # Arrange
        service = AIModelStorageService(mocked_settings, mocked_async_session)

        # Act
        await service.add_new_model(
            example_create_model_dto, mocked_model, mocked_tokenizer
        )

        # Assert
        assert mocked_async_session.add.call_count == 1
        assert mocked_async_session.commit.call_count == 1
        mocked_model.save_pretrained.assert_called_once()
        mocked_tokenizer.save_pretrained.assert_called_once()
        mocked_move.assert_called_once()

    @pytest.mark.asyncio
    @patch("shutil.rmtree")
    @patch("shutil.move")
    async def test_update_model_success(
        self,
        mocked_move,
        mocked_rmtree,
        mocked_settings,
        mocked_async_session,
        mocked_model,
        mocked_tokenizer,
        example_dto,
    ):
        # Arrange
        service = AIModelStorageService(mocked_settings, mocked_async_session)

        # Act
        await service.update_model(example_dto, mocked_model, mocked_tokenizer)

        # Assert
        mocked_async_session.merge.assert_called_once()
        mocked_async_session.commit.assert_called_once()
        mocked_move.assert_called_once_with(
            "some storage path 1_temp", "some storage path 1"
        )
        mocked_rmtree.assert_called_once_with("some storage path 1", ignore_errors=True)
        mocked_model.save_pretrained.assert_called_once_with("some storage path 1_temp")
        mocked_tokenizer.save_pretrained.assert_called_once_with(
            "some storage path 1_temp"
        )

    @pytest.mark.asyncio
    async def test_get_model_by_id_success(
        self, mocker, mocked_settings, mocked_async_session, example_dto
    ):
        # Arrange
        mocked_result = mocker.MagicMock()
        mocked_async_session.execute.return_value = mocked_result
        mocked_result.scalar_one_or_none.return_value = example_dto
        service = AIModelStorageService(mocked_settings, mocked_async_session)
        lm_id = 1

        # Act
        model_dto = await service.get_model_by_id(lm_id)

        # Assert
        assert model_dto == example_dto

    @pytest.mark.asyncio
    async def test_get_models_success(
        self, mocker, mocked_settings, mocked_async_session
    ):
        # Arrange
        mock_orm_instance = AIModelORM(
            ai_model_id=1,
            name="test_model",
            pipeline_tag="test_tag",
            storage_path="test_path",
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        mocked_result = mocker.MagicMock()
        mocked_result.scalars.return_value = [mock_orm_instance]
        mocked_async_session.execute.return_value = mocked_result
        service = AIModelStorageService(mocked_settings, mocked_async_session)

        # Act
        result = await service.get_models()

        # Assert
        mocked_async_session.execute.assert_called_once()
        assert len(result) == 1
        assert isinstance(result[0], AIModelDTO)
        assert result[0].name == "test_model"
        assert result[0].pipeline_tag == "test_tag"

    @pytest.mark.asyncio
    @patch("shutil.rmtree")
    async def test_delete_model_success(
        self, mock_rmtree, mocked_settings, mocked_async_session, example_dto
    ):
        # Arrange
        service = AIModelStorageService(mocked_settings, mocked_async_session)
        lm_id = 1

        # Act
        with patch.object(service, "get_model_by_id", return_value=example_dto):
            await service.delete_model_by_id(lm_id)

        # Assert
        mocked_async_session.delete.assert_called_once()
        mocked_async_session.commit.assert_called_once()
        mock_rmtree.assert_called_once_with("some storage path 1", ignore_errors=True)

    @pytest.mark.asyncio
    @patch("shutil.move")
    @patch("shutil.rmtree")
    async def test_add_model_fail_rollback(
        self,
        mock_rmtree,
        mocked_move,
        mocker,
        mocked_settings,
        mocked_async_session,
        mocked_model,
        mocked_tokenizer,
        example_create_model_dto,
    ):
        # Arrange
        mocked_async_session.add = mocker.MagicMock(
            side_effect=Exception("This is a test exception")
        )
        service = AIModelStorageService(mocked_settings, mocked_async_session)

        # Act
        with pytest.raises(InternalException):
            await service.add_new_model(
                example_create_model_dto, mocked_model, mocked_tokenizer
            )

        # Assert
        mocked_async_session.rollback.assert_called_once()
        mock_rmtree.assert_called_once()
        mocked_move.assert_not_called()

    @pytest.mark.asyncio
    @patch("shutil.move")
    @patch("shutil.rmtree")
    async def test_save_pretrained_fail_rollback(
        self,
        mock_rmtree,
        mocked_move,
        mocker,
        mocked_settings,
        mocked_async_session,
        mocked_model,
        mocked_tokenizer,
        example_create_model_dto,
    ):
        # Arrange
        mocked_model.save_pretrained = mocker.MagicMock(
            side_effect=Exception("This is a test exception")
        )
        service = AIModelStorageService(mocked_settings, mocked_async_session)

        # Act
        with pytest.raises(InternalException):
            await service.add_new_model(
                example_create_model_dto, mocked_model, mocked_tokenizer
            )

        # Assert
        mocked_async_session.rollback.assert_called_once()
        mock_rmtree.assert_called_once()
        mocked_move.assert_not_called()

    @pytest.mark.asyncio
    @patch("shutil.rmtree")
    async def test_update_model_fail_rollback(
        self,
        mock_rmtree,
        mocker,
        mocked_settings,
        mocked_async_session,
        mocked_model,
        mocked_tokenizer,
        example_dto,
    ):
        # Arrange
        mocked_async_session.merge = mocker.MagicMock(
            side_effect=Exception("This is a test exception")
        )
        service = AIModelStorageService(mocked_settings, mocked_async_session)

        # Act
        with pytest.raises(InternalException):
            await service.update_model(example_dto, mocked_model, mocked_tokenizer)

        # Assert
        mocked_async_session.rollback.assert_called_once()
        mock_rmtree.assert_called_once_with(
            "some storage path 1_temp", ignore_errors=True
        )

    @pytest.mark.asyncio
    async def test_get_model_by_id_throws_internal_exception(
        self, mocked_settings, mocked_async_session
    ):
        # Arrange
        mocked_async_session.execute.side_effect = Exception("Test exception")
        service = AIModelStorageService(mocked_settings, mocked_async_session)
        lm_id = 1

        # Act & Assert
        with pytest.raises(InternalException):
            await service.get_model_by_id(lm_id)

    @pytest.mark.asyncio
    async def test_get_models_throws_internal_exception(
        self, mocked_settings, mocked_async_session
    ):
        # Arrange
        mocked_async_session.execute.side_effect = Exception("Test exception")
        service = AIModelStorageService(mocked_settings, mocked_async_session)
        limit = 1

        # Act & Assert
        with pytest.raises(InternalException):
            await service.get_models(limit)

    @pytest.mark.asyncio
    async def test_delete_model_by_id_throws_internal_exception(
        self, mocker, mocked_settings, mocked_async_session
    ):
        # Arrange
        service = AIModelStorageService(mocked_settings, mocked_async_session)
        lm_id = 1
        mocker.patch.object(
            service, "get_model_by_id", side_effect=Exception("Test exception")
        )

        # Act & Assert
        with pytest.raises(InternalException):
            await service.delete_model_by_id(lm_id)
