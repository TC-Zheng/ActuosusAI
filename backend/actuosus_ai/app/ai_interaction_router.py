from typing import Tuple, List, Optional, Dict
import gc
import torch
from fastapi import APIRouter, WebSocket, Depends, WebSocketDisconnect
from pydantic import BaseModel

from actuosus_ai.ai_interaction.ai_chat_service import AIChatService
from actuosus_ai.ai_interaction.text_generation_service import TextGenerationService
from actuosus_ai.app.dependency import (
    get_text_generation_service, get_ai_chat_service,
)

router = APIRouter()


class TextGenerationRequest(BaseModel):
    prompt: str
    k: int = 10
    temperature: float = 1.0
    max_length: Optional[int] = None
    max_new_tokens: int = 50
    initial_spec: List[str] = []


class TextGenerationResponseWithAlt(BaseModel):
    response: List[Tuple[str, float]] = []
    end: bool = False


class ModelConnectionSuccessResponse(BaseModel):
    name: str
    estimated_ram: float
    estimated_vram: float


@router.websocket("/ws/text_generation/")
async def websocket_text_generation_endpoint(
    websocket: WebSocket,
    ai_model_id: int,
    quantization: Optional[str] = "float16",
    gguf_file_name: Optional[str] = None,
    text_generation_service: TextGenerationService = Depends(
        get_text_generation_service
    ),
) -> None:
    await websocket.accept()
    # Receive onopen info about how to load the model
    await text_generation_service.load_model(
        ai_model_id=ai_model_id,
        quantization=quantization,
        gguf_file_name=gguf_file_name,
    )
    await websocket.send_json(
        ModelConnectionSuccessResponse(
            name=text_generation_service.ai_model_name,
            estimated_ram=text_generation_service.estimated_ram,
            estimated_vram=text_generation_service.estimated_vram,
        ).model_dump()
    )
    try:
        while True:
            data = TextGenerationRequest(**await websocket.receive_json())
            for (
                new_tokens_list
            ) in text_generation_service.generate_tokens_with_probabilities(
                **data.model_dump(),
            ):
                await websocket.send_json(
                    TextGenerationResponseWithAlt(
                        response=new_tokens_list, end=False
                    ).model_dump()
                )
            await websocket.send_json(
                TextGenerationResponseWithAlt(response=[], end=True).model_dump()
            )
    except WebSocketDisconnect:
        del text_generation_service.model
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        print(f"Client disconnected for item: {ai_model_id}")

class AIChatRequest(BaseModel):
    messages: List[Dict[str, str]]
    k: int = 10
    temperature: float = 1.0
    max_length: Optional[int] = None
    max_new_tokens: int = 10000

@router.websocket("/ws/chat/")
async def websocket_chat_endpoint(
    websocket: WebSocket,
    ai_model_id: int,
    quantization: Optional[str] = "float16",
    gguf_file_name: Optional[str] = None,
    ai_chat_service: AIChatService = Depends(
        get_ai_chat_service
    ),
) -> None:
    """Always add an empty "role": "assistant" at the end of the messages list if the last message is from the user"""
    await websocket.accept()
    # Receive onopen info about how to load the model
    await ai_chat_service.load_model(
        ai_model_id=ai_model_id,
        quantization=quantization,
        gguf_file_name=gguf_file_name,
    )
    await websocket.send_json(
        ModelConnectionSuccessResponse(
            name=ai_chat_service.ai_model_name,
            estimated_ram=ai_chat_service.estimated_ram,
            estimated_vram=ai_chat_service.estimated_vram,
        ).model_dump()
    )
    try:
        while True:
            data = AIChatRequest(**await websocket.receive_json())
            for (
                new_tokens_list
            ) in ai_chat_service.generate_chat_tokens_with_probabilities(
                **data.model_dump(),
            ):
                await websocket.send_json(
                    TextGenerationResponseWithAlt(
                        response=new_tokens_list, end=False
                    ).model_dump()
                )
            await websocket.send_json(
                TextGenerationResponseWithAlt(response=[], end=True).model_dump()
            )
    except WebSocketDisconnect:
        del ai_chat_service.model
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        print(f"Client disconnected for item: {ai_model_id}")