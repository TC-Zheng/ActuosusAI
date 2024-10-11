from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from actuosus_ai.ai_model_manager.ai_model_download_service import (
    AIModelDownloadService,
)
from actuosus_ai.ai_model_manager.connection import get_async_db_session
from actuosus_ai.ai_model_manager.language_model_service import LanguageModelService
from actuosus_ai.common.settings import get_settings, Settings


def get_language_model_service(
    settings: Settings = Depends(get_settings),
    async_session: AsyncSession = Depends(get_async_db_session),
) -> LanguageModelService:
    return LanguageModelService(settings, async_session)


def get_ai_download_service(
    language_model_service: LanguageModelService = Depends(get_language_model_service),
) -> AIModelDownloadService:
    return AIModelDownloadService(language_model_service)
