from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from actuosus_ai.ai_model_manager.ai_model_download_service import (
    AIModelDownloadService,
)
from actuosus_ai.ai_model_manager.connection import get_async_db_session
from actuosus_ai.ai_model_manager.ai_model_storage_service import AIModelStorageService
from actuosus_ai.common.settings import get_settings, Settings


def get_ai_model_storage_service(
    settings: Settings = Depends(get_settings),
    async_session: AsyncSession = Depends(get_async_db_session),
) -> AIModelStorageService:
    return AIModelStorageService(settings, async_session)


def get_ai_download_service(
    ai_model_storage_service: AIModelStorageService = Depends(
        get_ai_model_storage_service
    ),
) -> AIModelDownloadService:
    return AIModelDownloadService(ai_model_storage_service)
