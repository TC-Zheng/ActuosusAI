from typing import Optional, List

from fastapi import APIRouter, Depends

from actuosus_ai.ai_model_manager.ai_model_download_service import (
    AIModelDownloadService,
)
from actuosus_ai.ai_model_manager.dto import AIModelDTO
from actuosus_ai.ai_model_manager.ai_model_storage_service import AIModelStorageService
from actuosus_ai.app.dependency import get_ai_download_service, get_ai_model_service
from pydantic import BaseModel

router = APIRouter()


class DownloadHFModelRequest(BaseModel):
    hf_model_id: str


class DownloadHFModelResponse(BaseModel):
    success: bool
    message: str


@router.post("/download/hf_lang_model/")
async def download_ai_model(
    request: DownloadHFModelRequest,
    download_ai_model_service: AIModelDownloadService = Depends(
        get_ai_download_service
    ),
) -> DownloadHFModelResponse:
    """
    Download a Language Model based on it's name (id)
    """
    await download_ai_model_service.download_lm_from_hugging_face(request.hf_model_id)

    return DownloadHFModelResponse(
        success=True, message="Model downloaded successfully"
    )


class GetModelRequest(BaseModel):
    limit: Optional[int] = None


class GetModelResponse(BaseModel):
    models: List[AIModelDTO]


@router.get("models")
async def get_models(
    request: GetModelRequest,
    language_model_service: AIModelStorageService = Depends(get_ai_model_service),
) -> GetModelResponse:
    return {"models": "models"}
