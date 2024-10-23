from typing import Optional

from actuosus_ai.ai_interaction.text_generation_service import TextGenerationService


class AIChatService:
    def __init__(self, text_generation_service: TextGenerationService):
        self.text_generation_service = text_generation_service

    # Delegate attribute access to text generation service
    def __getattr__(self, name):
        # This will forward access to the fields of `a_instance` (i.e., id, name)
        return getattr(self.text_generation_service, name)

    async def load_model(self, ai_model_id: int, quantization: Optional[str] = None, gguf_file_name: Optional[str] = None) -> None:
        await self.text_generation_service.load_model(ai_model_id, quantization, gguf_file_name)

    def generate_conversation_with_alt(self, prompt: str, system_prompt: str, ai_role: str, user_role: str,  max_length: Optional[int] = None, max_new_tokens: int = 50, k: int = 10, temperature: float = 1.0):
        if self.tokenizer.chat_template:
            input = self.tokenizer.chat_template(prompt)
        else:
            input = prompt
        return self.text_generation_service.generate_with_alt(prompt, max_length, max_new_tokens, k, temperature)