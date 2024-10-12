from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from actuosus_ai.ai_model_manager.ai_model_download_service import (
    AIModelDownloadService,
)
from actuosus_ai.ai_model_manager.connection import get_async_db_session
from actuosus_ai.ai_model_manager.ai_model_storage_service import AIModelStorageService
from actuosus_ai.common.settings import get_settings, Settings


def get_ai_model_service(
    async_session: AsyncSession = Depends(get_async_db_session),
) -> AIModelStorageService:
    return AIModelStorageService(async_session)


def get_ai_download_service(
    settings: Settings = Depends(get_settings),
    language_model_service: AIModelStorageService = Depends(get_ai_model_service),
) -> AIModelDownloadService:
    return AIModelDownloadService(settings, language_model_service)
