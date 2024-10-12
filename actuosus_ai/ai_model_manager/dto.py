from pydantic import BaseModel, Field
from datetime import datetime


class AIModelDTO(BaseModel):
    ai_model_id: int = Field(..., frozen=True)
    name: str = Field(..., min_length=1)
    storage_path: str
    pipeline_tag: str
    created_at: datetime = Field(..., frozen=True)
    updated_at: datetime


class CreateNewAIModelDTO(BaseModel):
    name: str = Field(..., min_length=1)
    storage_path: str = Field(..., min_length=1)
    pipeline_tag: str = Field(..., min_length=1)
