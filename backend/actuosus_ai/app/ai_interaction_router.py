from typing import Tuple, List, Optional, Dict
import gc
import torch
from fastapi import APIRouter, WebSocket, Depends, WebSocketDisconnect
from pydantic import BaseModel
from sympy.physics.units import temperature

from actuosus_ai.ai_interaction.chat_websocket_orchestrator import (
    ChatWebSocketOrchestrator, ResponseTypeId, ChatResponse, ModelInfo,
)
from actuosus_ai.ai_interaction.text_generation_service import TextGenerationService
from actuosus_ai.app.dependency import (
    get_text_generation_service,
    get_ai_chat_service,
    get_chat_websocket_orchestrator,
)

router = APIRouter()


class TextGenerationRequest(BaseModel):
    prompt: str
    k: int = 10
    temperature: float = 1.0
    max_length: Optional[int] = None
    max_new_tokens: int = 50


class TextGenerationResponseWithAlt(BaseModel):
    response: List[Tuple[str, float]] = []
    end: bool = False



class AIChatRequest(BaseModel):
    messages: List[Dict[str, str]]
    k: int = 10
    temperature: float = 1.0
    max_length: Optional[int] = None
    max_new_tokens: int = 10000


@router.websocket("/ws/chat/")
async def websocket_chat_endpoint(
    websocket: WebSocket,
    chat_type: str,
    ai_model_id: int,
    quantization: Optional[str] = "float16",
    gguf_file_name: Optional[str] = None,
    chat_websocket_orchestrator: ChatWebSocketOrchestrator = Depends(
        get_chat_websocket_orchestrator
    ),
) -> None:
    await websocket.accept()
    # Receive onopen info about how to load the model
    await chat_websocket_orchestrator.load(
        chat_type=chat_type,
        websocket=websocket,
        ai_model_id=ai_model_id,
        quantization=quantization,
        gguf_file_name=gguf_file_name,
    )
    await websocket.send_json(
        ChatResponse(
            type_id=ResponseTypeId.MODEL_INFO,
             payload=ModelInfo(
                ai_model_name=chat_websocket_orchestrator.chat_service.ai_model_name,
                estimated_ram=chat_websocket_orchestrator.chat_service.estimated_ram,
                estimated_vram=chat_websocket_orchestrator.chat_service.estimated_vram,
                max_length=chat_websocket_orchestrator.chat_service.max_length,
                temperature=chat_websocket_orchestrator.temperature,
                max_new_tokens=chat_websocket_orchestrator.max_new_tokens,
             )
        ).model_dump()
    )
    try:
        await chat_websocket_orchestrator.run()
    except WebSocketDisconnect:
        del chat_websocket_orchestrator.chat_service.text_generation_service.model
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        print(f"Client disconnected for item: {ai_model_id}")
