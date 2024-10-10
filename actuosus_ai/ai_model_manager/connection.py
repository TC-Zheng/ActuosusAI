import os

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from typing import AsyncGenerator

from actuosus_ai.ai_model_manager.orm import BaseORM
from actuosus_ai.common.settings import Settings, get_settings


async def get_async_db_session(
    settings: Settings = Depends(get_settings),
) -> AsyncGenerator[AsyncSession, None]:
    if not os.path.exists(settings.base_file_storage_path):
        os.makedirs(settings.base_file_storage_path)
    async_engine = create_async_engine(settings.database_url, echo=True)
    asyncSessionLocal = async_sessionmaker(
        bind=async_engine, autocommit=False, autoflush=False, class_=AsyncSession
    )
    async with async_engine.begin() as conn:
        await conn.run_sync(BaseORM.metadata.create_all)
    async with asyncSessionLocal() as session:
        yield session
