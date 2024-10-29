from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from actuosus_ai.ai_interaction.ai_chat_service import AIChatService
from actuosus_ai.ai_interaction.chat_websocket_orchestrator import (
    ChatWebSocketOrchestrator,
)
from actuosus_ai.ai_interaction.text_generation_service import TextGenerationService
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
    settings: Settings = Depends(get_settings),
) -> AIModelDownloadService:
    return AIModelDownloadService(ai_model_storage_service, settings=settings)


def get_text_generation_service(
    ai_model_storage_service: AIModelStorageService = Depends(
        get_ai_model_storage_service
    ),
) -> TextGenerationService:
    return TextGenerationService(ai_model_storage_service)


def get_ai_chat_service(
    text_generation_service: TextGenerationService = Depends(
        get_text_generation_service
    ),
) -> AIChatService:
    return AIChatService(text_generation_service)


def get_chat_websocket_orchestrator(
    ai_chat_service: AIChatService = Depends(get_ai_chat_service),
) -> ChatWebSocketOrchestrator:
    return ChatWebSocketOrchestrator(ai_chat_service)
