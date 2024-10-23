from typing import AsyncGenerator

import pytest
import pytest_asyncio
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    async_sessionmaker,
    AsyncEngine,
    AsyncSession,
)

from actuosus_ai.ai_model_manager.orm import BaseORM, AIModelORM


class TestORM:
    @pytest_asyncio.fixture
    async def async_engine(self) -> AsyncGenerator[AsyncEngine, None]:
        async_engine = create_async_engine("sqlite+aiosqlite://", echo=True)
        yield async_engine
        await async_engine.dispose()

    @pytest_asyncio.fixture
    async def session(
        self, async_engine: AsyncEngine
    ) -> AsyncGenerator[AsyncSession, None]:
        async with async_engine.begin() as conn:
            await conn.run_sync(BaseORM.metadata.create_all)
        async_session_maker = async_sessionmaker(async_engine, expire_on_commit=False)
        async with async_session_maker() as session:
            yield session

    @pytest.fixture
    def example_ai_model(self) -> AIModelORM:
        return AIModelORM(
            name="some name 1",
            storage_path="some model path 1",
            pipeline_tag="some pipeline tag 1",
        )

    @pytest.mark.asyncio
    async def test_save_llm(self, session: AsyncSession, example_ai_model) -> None:
        # Arrange

        # Act
        session.add(example_ai_model)
        await session.commit()

        # Assert
        assert example_ai_model.id is not None
        saved_ai_model = await session.get(AIModelORM, example_ai_model.id)
        assert saved_ai_model is not None
        assert saved_ai_model.name == "some name 1"

    @pytest.mark.asyncio
    async def test_date_created_updated(
        self, session: AsyncSession, example_ai_model
    ) -> None:
        # Arrange

        # Act
        session.add(example_ai_model)
        await session.commit()

        # Assert
        assert example_ai_model.created_at is not None
        assert example_ai_model.updated_at is not None

    @pytest.mark.asyncio
    async def test_missing_name_raise_error(
        self, session: AsyncSession, example_ai_model
    ) -> None:
        # Arrange
        example_ai_model.name = None

        print(example_ai_model)
        # Act
        session.add(example_ai_model)

        # Assert
        with pytest.raises(IntegrityError) as exc_info:
            await session.commit()
        assert "NOT NULL constraint failed" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_missing_storage_path_raise_error(
        self, session: AsyncSession, example_ai_model
    ) -> None:
        # Arrange
        example_ai_model.storage_path = None

        # Act
        session.add(example_ai_model)

        # Assert
        with pytest.raises(IntegrityError) as exc_info:
            await session.commit()
        assert "NOT NULL constraint failed" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_missing_pipeline_tag_raise_error(
        self, session: AsyncSession, example_ai_model
    ) -> None:
        # Arrange
        example_ai_model.pipeline_tag = None

        # Act
        session.add(example_ai_model)

        # Assert
        with pytest.raises(IntegrityError) as exc_info:
            await session.commit()
        assert "NOT NULL constraint failed" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_remove_llm(self, session: AsyncSession, example_ai_model) -> None:
        # Arrange
        session.add(example_ai_model)
        await session.commit()

        # Act
        await session.delete(example_ai_model)
        await session.commit()

        # Assert
        assert await session.get(AIModelORM, example_ai_model.id) is None

    @pytest.mark.asyncio
    async def test_update_llm(self, session: AsyncSession, example_ai_model) -> None:
        # Arrange
        session.add(example_ai_model)
        await session.commit()

        # Act
        example_ai_model.name = "new name"
        await session.commit()

        # Assert
        updated_ai_model = await session.get(AIModelORM, example_ai_model.id)
        assert updated_ai_model.name == "new name"
