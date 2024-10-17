from typing import Tuple, List

from fastapi import APIRouter, WebSocket, Depends, WebSocketDisconnect
from pydantic import BaseModel

from actuosus_ai.ai_interaction.text_generation_service import TextGenerationService
from actuosus_ai.app.dependency import (
    get_text_generation_service,
)

router = APIRouter()

class TextGenerationRequest(BaseModel):
    prompt: str
    k: int = 10
    temperature: float = 1.0
    max_length: int = None
    max_new_tokens: int = 100

class TextGenerationResponseWithAlt(BaseModel):
    response: List[List[Tuple[str, float]]]

@router.websocket("/ws/generation/{ai_model_id}/")
async def websocket_text_generation_endpoint(
    websocket: WebSocket,
    ai_model_id: int,
    text_generation_service: TextGenerationService = Depends(
        get_text_generation_service
    ),
):
    await websocket.accept()
    await text_generation_service.load_model(ai_model_id=ai_model_id)
    try:
        while True:
            data = TextGenerationRequest(**await websocket.receive_json())
            response = text_generation_service.generate_with_alt(data.prompt, data.max_length, data.max_new_tokens, data.k, data.temperature)
            await websocket.send_json(TextGenerationResponseWithAlt(response=response).model_dump())
    except WebSocketDisconnect:
        print(f"Client disconnected for item: {ai_model_id}")