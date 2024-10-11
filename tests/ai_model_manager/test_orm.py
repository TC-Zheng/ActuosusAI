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

from actuosus_ai.ai_model_manager.orm import BaseORM, LanguageModelORM


class TestORM:
    @pytest_asyncio.fixture()
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

    @pytest.mark.asyncio
    async def test_save_llm(self, session: AsyncSession) -> None:
        # Arrange
        llm = LanguageModelORM(
            name="some name 1",
            storage_path="some model path 1",
        )

        # Act
        session.add(llm)
        await session.commit()

        # Assert
        assert llm.id is not None
        saved_llm = await session.get(LanguageModelORM, llm.id)
        assert saved_llm is not None
        assert saved_llm.name == "some name 1"

    @pytest.mark.asyncio
    async def test_date_created_updated(self, session: AsyncSession) -> None:
        # Arrange
        llm = LanguageModelORM(
            name="some name 1",
            storage_path="some model path 1",
        )

        # Act
        session.add(llm)
        await session.commit()

        # Assert
        assert llm.created_at is not None
        assert llm.updated_at is not None

    @pytest.mark.asyncio
    async def test_missing_name_raise_error(self, session: AsyncSession) -> None:
        # Arrange
        llm = LanguageModelORM(
            storage_path="some model path 1",
        )

        # Act
        session.add(llm)

        # Assert
        with pytest.raises(IntegrityError) as exc_info:
            await session.commit()
        assert "NOT NULL constraint failed: llm.name" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_remove_llm(self, session: AsyncSession) -> None:
        # Arrange
        llm = LanguageModelORM(
            name="some name 1",
            storage_path="some model path 1",
        )
        session.add(llm)
        await session.commit()

        # Act
        await session.delete(llm)
        await session.commit()

        # Assert
        assert await session.get(LanguageModelORM, llm.id) is None

    @pytest.mark.asyncio
    async def test_update_llm(self, session: AsyncSession) -> None:
        # Arrange
        llm = LanguageModelORM(
            name="some name 1",
            storage_path="some model path 1",
        )
        session.add(llm)
        await session.commit()

        # Act
        llm.name = "new name"
        await session.commit()

        # Assert
        updated_llm = await session.get(LanguageModelORM, llm.id)
        assert updated_llm.name == "new name"
