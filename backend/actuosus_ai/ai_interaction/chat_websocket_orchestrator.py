import copy
from typing import Optional, Any, Union, Dict, List

from fastapi import WebSocket

from actuosus_ai.ai_interaction.ai_chat_service import AIChatService, ChatMessage
from pydantic import BaseModel

from actuosus_ai.ai_interaction.text_generation_service import WordProbList
from actuosus_ai.common.actuosus_exception import ValidationException
from actuosus_ai.common.message_trie import MessageTrie, Message

from enum import Enum


class ChatType(Enum):
    TEXT_GENERATION = "text_generation"
    CHAT = "chat"


class NewMessageRequest(BaseModel):
    type_id: int = 0
    content: str
    source: str
    i: int
    j: int


class SelectWordRequest(BaseModel):
    type_id: int = 1
    i: int
    j: int
    new_word: str

class ChangeConfigRequest(BaseModel):
    type_id: int = 2
    config_name: str
    config_value: str

class RefreshWordRequest(BaseModel):
    type_id: int = 3
    i: int
    j: int

class ResponseTypeId:
    MODEL_INFO = 0
    NEW_MESSAGE = 1
    NEW_MESSAGE_END = 2
    REFRESH_WORD = 3

class ModelInfo(BaseModel):
    ai_model_name: str
    estimated_ram: float
    estimated_vram: float

class NewMessage(BaseModel):
    source: str
    content: WordProbList

class WordRefresh(BaseModel):
    i: int
    j: int
    content: WordProbList

class ChatResponse(BaseModel):
    type_id: int
    payload: None | ModelInfo | NewMessage | WordRefresh

class ChatWebSocketOrchestrator:
    def __init__(self, ai_chat_service: AIChatService):
        self.chat_service = ai_chat_service
        self.trie = MessageTrie()
        self.messages: list[Message] = []
        self.text_generation_service = ai_chat_service.text_generation_service
        self.chat_type = None
        self.websocket = None
        self.user_role = "user"
        self.ai_role = "assistant"
        self.system_prompt = "You are a helpful assistant"
        self.temperature = 1.0
        self.max_new_tokens = 200
        self.min_prob = 0.001

    async def load(
        self,
        websocket: WebSocket,
        chat_type: str,
        ai_model_id: int,
        quantization: Optional[str] = None,
        gguf_file_name: Optional[str] = None,
    ) -> None:
        await self.chat_service.load_model(ai_model_id, quantization, gguf_file_name)
        self.chat_type = ChatType(chat_type)
        self.websocket = websocket

    @staticmethod
    def _parse_chat_request(
        json_body: Dict,
    ) -> Union[
        NewMessageRequest, SelectWordRequest, ChangeConfigRequest, RefreshWordRequest
    ]:
        type_id = json_body.get("type_id")

        if type_id == 0:
            return NewMessageRequest(**json_body)
        elif type_id == 1:
            return SelectWordRequest(**json_body)
        elif type_id == 2:
            return ChangeConfigRequest(**json_body)
        elif type_id == 3:
            return RefreshWordRequest(**json_body)
        else:
            raise ValidationException("Invalid type_id")

    @staticmethod
    def flatten_messages(content: List[WordProbList | str]) -> str:
        return "".join(
            [item[0][0] if isinstance(item, list) else item for item in content]
        )

    def convert_for_chat(self, messages: List[Message]) -> List[ChatMessage]:
        return [
            {
                "role": message["source"],
                "content": self.flatten_messages(message["content"]),
            }
            for message in messages
        ]

    def convert_for_text_generation(self, messages: List[Message]) -> str:
        return self.flatten_messages(messages[-1]["content"])

    async def generation(self):
        # Generate the messages
        if self.chat_type == ChatType.CHAT:
            if self.messages[-1]["source"] == self.user_role:
                self.messages.append({"content": [], "source": self.ai_role})
            print(self.convert_for_chat(self.messages))
            for item in self.chat_service.generate_chat_tokens_with_probabilities(
                messages=self.convert_for_chat(self.messages), temperature=self.temperature, max_new_tokens=self.max_new_tokens, min_prob=self.min_prob
            ):
                await self.websocket.send_json(ChatResponse(type_id=ResponseTypeId.NEW_MESSAGE, payload=NewMessage(source='ai',content=item)).model_dump())
                self.messages[-1]["content"].append(item)

        elif self.chat_type == ChatType.TEXT_GENERATION:
            for item in self.text_generation_service.generate_tokens_with_probabilities(
                prompt=self.convert_for_text_generation(self.messages), temperature=self.temperature, max_new_tokens=self.max_new_tokens, min_prob=self.min_prob
            ):
                await self.websocket.send_json(ChatResponse(type_id=ResponseTypeId.NEW_MESSAGE, payload=NewMessage(source='ai',content=item)).model_dump())
                self.messages[-1]["content"].append(item)

        # End and save the message
        await self.websocket.send_json(ChatResponse(type_id=ResponseTypeId.NEW_MESSAGE_END, payload=None).model_dump())
        self.trie.insert(self.messages)

    async def handle_new_message(self, request: NewMessageRequest) -> None:
        # append message to messages list
        if request.i == -1:
            self.messages.append(
                {"content": [request.content], "source": request.source}
            )
        else:
            self.messages = self.messages[: request.i]
            self.messages[-1]["content"] = self.messages[-1]["content"][: request.j] + [
                request.content
            ]
        await self.generation()


    async def handle_select_new_word(self, request: SelectWordRequest) -> None:
        print(self.messages)
        print(request.i, request.j)
        self.messages = self.messages[: request.i + 1]
        self.messages[-1]["content"] = self.messages[-1]["content"][: request.j] + [
            request.new_word
        ]
        print(self.messages)
        print(request.i, request.j)
        await self.generation()

    async def handle_refresh_word(self, request: RefreshWordRequest) -> None:
        temp_message = copy.deepcopy(self.messages[: request.i + 1])
        temp_message[-1]["content"] = temp_message[-1]["content"][: request.j]
        if self.chat_type == ChatType.CHAT:
            for item in self.chat_service.generate_chat_tokens_with_probabilities(
                    messages=self.convert_for_chat(temp_message), max_new_tokens=1, temperature=self.temperature, min_prob=self.min_prob
            ):
                await self.websocket.send_json(ChatResponse(type_id=ResponseTypeId.REFRESH_WORD,
                                                            payload=WordRefresh(i=request.i, j=request.j, content=item)).model_dump())

        elif self.chat_type == ChatType.TEXT_GENERATION:
            for item in self.text_generation_service.generate_tokens_with_probabilities(
                    prompt=self.convert_for_text_generation(temp_message), max_new_tokens=1, temperature=self.temperature, min_prob=self.min_prob
            ):
                await self.websocket.send_json(ChatResponse(type_id=ResponseTypeId.NEW_MESSAGE,
                                                            payload=WordRefresh(i=request.i, j=request.j, content=item)).model_dump())


    async def run(self) -> None:
        while True:
            data = await self.websocket.receive_json()
            request = self._parse_chat_request(data)
            match request.type_id:
                case 0:
                    await self.handle_new_message(request)
                case 1:
                    await self.handle_select_new_word(request)
                case 2:
                    setattr(self, request.config_name, int(request.config_value) if request.config_value.isdigit() else float(request.config_value))
                case 3:
                    await self.handle_refresh_word(request)
