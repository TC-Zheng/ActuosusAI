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


class StandardResponse(BaseModel):
    success: bool
    message: str


class DownloadHFModelRequest(BaseModel):
    hf_model_id: str


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


class EditModelRequest(BaseModel):
    name: Optional[str] = None
    pipeline_tag: Optional[str] = None


@router.post("/model/{ai_model_id}/")
async def edit_model(
    ai_model_id: int,
    request: EditModelRequest,
    ai_model_storage_service: AIModelStorageService = Depends(
        get_ai_model_storage_service
    ),
) -> StandardResponse:
    """
    Edit a model's name based on it's id
    """
    dto = await ai_model_storage_service.get_model_by_id(ai_model_id)
    if dto:
        update_data = request.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(dto, key, value)
    else:
        raise NotFoundException("Model not found")
    await ai_model_storage_service.update_model(dto)

    return StandardResponse(success=True, message="Model name edited successfully")


@router.post("/model/{ai_model_id}/copy/")
async def copy_model(
    ai_model_id: int,
    ai_model_storage_service: AIModelStorageService = Depends(
        get_ai_model_storage_service
    ),
) -> StandardResponse:
    """
    Copy a model based on it's id
    """
    await ai_model_storage_service.copy_model_by_id(ai_model_id)

    return StandardResponse(success=True, message="Model copied successfully")


@router.delete("/model/{ai_model_id}/")
async def delete_model(
    ai_model_id: int,
    ai_model_storage_service: AIModelStorageService = Depends(
        get_ai_model_storage_service
    ),
) -> StandardResponse:
    """
    Delete a model based on it's id
    """
    await ai_model_storage_service.delete_model_by_id(ai_model_id)

    return StandardResponse(success=True, message="Model deleted successfully")


class ModelDetails(BaseModel):
    ai_model_id: int
    name: str
    pipeline_tag: str
    created_at: datetime
    updated_at: datetime


class GetModelResponse(BaseModel):
    models: List[ModelDetails]


@router.get("/models/")
async def get_models(
    limit: Optional[int] = None,
    offset: Optional[int] = None,
    name: Optional[str] = None,
    pipeline_tag: Optional[str] = None,
    order_by: Optional[str] = None,
    is_desc: Optional[bool] = True,
    ai_model_storage_service: AIModelStorageService = Depends(
        get_ai_model_storage_service
    ),
) -> GetModelResponse:
    """
    Get models
    """
    dtos = await ai_model_storage_service.get_models(
        limit, offset, name, pipeline_tag, order_by, is_desc
    )

    return GetModelResponse(models=[ModelDetails(**dto.model_dump()) for dto in dtos])


class SearchHuggingFaceResponse(BaseModel):
    ai_model_names: List[str]


@router.get("/huggingface/search/{ai_model_name:path}/")
async def search_hugging_face(
    ai_model_name: str,
    download_ai_model_service: AIModelDownloadService = Depends(
        get_ai_download_service
    ),
) -> SearchHuggingFaceResponse:
    """
    Search Hugging Face models
    """
    ai_model_names = await download_ai_model_service.search_hub_with_name(ai_model_name, 10)
    return SearchHuggingFaceResponse(ai_model_names=ai_model_names)


class GGUFFileNamesResponse(BaseModel):
    gguf_file_names: List[str]


@router.get("/gguf/files/{ai_model_id}/")
async def get_gguf_file_names(
    ai_model_id: int,
    ai_model_storage_service: AIModelStorageService = Depends(
        get_ai_model_storage_service
    ),
) -> GGUFFileNamesResponse:
    """
    Get gguf file names for a model based on it's id
    """
    return GGUFFileNamesResponse(
        gguf_file_names=await ai_model_storage_service.get_all_gguf_files(ai_model_id)
    )
