from pydantic import BaseModel, Field
from datetime import datetime


class BaseAIModelDTO(BaseModel):
    lm_id: int = Field(..., frozen=True)
    name: str = Field(..., min_length=1)
    storage_path: str
    created_at: datetime = Field(..., frozen=True)
    updated_at: datetime


class LanguageModelDTO(BaseAIModelDTO):
    pass
