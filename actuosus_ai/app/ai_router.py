from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, Depends

from actuosus_ai.ai_model_manager.ai_model_download_service import (
    AIModelDownloadService,
)
from actuosus_ai.ai_model_manager.ai_model_storage_service import AIModelStorageService
from actuosus_ai.app.dependency import (
    get_ai_download_service,
    get_ai_model_storage_service,
)
from pydantic import BaseModel

from actuosus_ai.common.actuosus_exception import NotFoundException

router = APIRouter()


class SingleModelIdRequest(BaseModel):
    ai_model_id: int


class StandardResponse(BaseModel):
    success: bool
    message: str


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
) -> StandardResponse:
    """
    Download a Language Model based on it's name (id)
    """
    await download_ai_model_service.download_lm_from_hugging_face(request.hf_model_id)

    return StandardResponse(success=True, message="Model downloaded successfully")


@router.post("/copy_model/")
async def copy_model(
    request: SingleModelIdRequest,
    language_model_service: AIModelStorageService = Depends(
        get_ai_model_storage_service
    ),
) -> StandardResponse:
    """
    Copy a model based on it's id
    """
    await language_model_service.copy_model_by_id(request.ai_model_id)

    return StandardResponse(success=True, message="Model copied successfully")


class EditModelNameRequest(BaseModel):
    ai_model_id: int
    new_name: str


@router.post("/edit_model_name/")
async def edit_model_name(
    request: EditModelNameRequest,
    language_model_service: AIModelStorageService = Depends(
        get_ai_model_storage_service
    ),
) -> StandardResponse:
    """
    Edit a model's name based on it's id
    """
    dto = await language_model_service.get_model_by_id(request.ai_model_id)
    if dto:
        dto.name = request.new_name
    else:
        raise NotFoundException("Model not found")
    await language_model_service.update_model(dto)

    return StandardResponse(success=True, message="Model name edited successfully")


class ModelDetails(BaseModel):
    ai_model_id: int
    name: str
    pipeline_tag: str
    created_at: datetime
    updated_at: datetime

class GetModelResponse(BaseModel):
    models: List[ModelDetails]

@router.get("/get_models/")
async def get_models(
    limit: Optional[int] = None,
    offset: Optional[int] = None,
    name: Optional[str] = None,
    pipeline_tag: Optional[str] = None,
    order_by: Optional[str] = None,
    is_desc: Optional[bool] = True,
    language_model_service: AIModelStorageService = Depends(
        get_ai_model_storage_service
    ),
) -> GetModelResponse:
    """
    Get all models
    """
    dtos = await language_model_service.get_models(
        limit, offset, name, pipeline_tag, order_by, is_desc
    )

    return GetModelResponse(models=[ModelDetails(**dto.model_dump()) for dto in dtos])
