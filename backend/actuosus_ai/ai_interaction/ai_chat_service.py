from typing import Optional, Generator, List, Tuple, Any, TypedDict

from actuosus_ai.ai_interaction.text_generation_service import TextGenerationService
from actuosus_ai.common.utils import parse_jinja2_messages, remove_trailing_eot_token


class ChatMessage(TypedDict):
    role: str
    content: str


class AIChatService:
    def __init__(self, text_generation_service: TextGenerationService):
        self.text_generation_service = text_generation_service

    # Delegate attribute access to text generation service
    def __getattr__(self, name: str) -> Any:
        return getattr(self.text_generation_service, name)

    async def load_model(
        self,
        ai_model_id: int,
        quantization: Optional[str] = None,
        gguf_file_name: Optional[str] = None,
    ) -> None:
        await self.text_generation_service.load_model(
            ai_model_id, quantization, gguf_file_name
        )

    def _format_chat(self, messages: List[ChatMessage]) -> str:
        if self.tokenizer.chat_template is not None:
            # Use the custom chat template
            return remove_trailing_eot_token(
                self.tokenizer.apply_chat_template(
                    messages, tokenize=False, continue_final_message=True
                )
            )
        else:
            # Use a default ChatML template
            formatted_messages = []
            for message in messages:
                role = message["role"]
                content = message["content"]
                formatted_messages.append(f"<|im_start|>{role}\n{content}<|im_end|>\n")
            return "".join(formatted_messages).rstrip("<|im_end|>\n")

    def generate_chat_tokens_with_probabilities(
        self,
        messages: List[ChatMessage],
        max_length: Optional[int] = None,
        max_new_tokens: int = 2000,
        k: int = 10,
        temperature: float = 1.0,
        min_prob: float = 0.001,
    ) -> Generator[List[Tuple[str, float]], None, None]:
        if self.gguf:
            # Check if the model has a jinja2 chat template
            if "tokenizer.chat_template" in self.model.metadata:
                template = self.model.metadata["tokenizer.chat_template"]
                prompt = parse_jinja2_messages(template, messages)
            else:
                prompt = self._format_chat(messages)
            yield from self.text_generation_service.generate_tokens_with_probabilities_gguf(
                prompt=prompt,
                max_length=max_length,
                max_new_tokens=max_new_tokens,
                k=k,
                temperature=temperature,
                min_prob=min_prob,
                is_chat=True,
            )
        else:
            prompt = self._format_chat(messages)
            yield from self.text_generation_service.generate_tokens_with_probabilities_hf(
                prompt=prompt,
                max_length=max_length,
                max_new_tokens=max_new_tokens,
                k=k,
                temperature=temperature,
                min_prob=min_prob,
            )
