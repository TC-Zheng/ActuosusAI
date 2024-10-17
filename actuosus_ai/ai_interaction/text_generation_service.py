import time
from typing import Tuple, List

import torch
from torch import Tensor
from transformers import AutoModelForCausalLM, AutoTokenizer
from transformers.utils import is_torch_cuda_available

from actuosus_ai.ai_model_manager.ai_model_storage_service import AIModelStorageService


class TextGenerationService:
    def __init__(self, storage_service: AIModelStorageService):
        self.storage_service = storage_service
        self.model = None
        self.tokenizer = None
        self.device = None

    async def load_model(self, ai_model_id: int, device: str = None):
        dto = await self.storage_service.get_model_by_id(ai_model_id)
        if device is None:
            if is_torch_cuda_available():
                device = "cuda"
            else:
                device = "cpu"
        self.device = device
        self.model = AutoModelForCausalLM.from_pretrained(dto.storage_path).to(
            self.device
        )
        self.tokenizer = AutoTokenizer.from_pretrained(dto.storage_path)

    def generate_top_k_token_with_prob(
        self, tokens: Tensor, k: int = 10, temperature: float = 1.0
    ) -> List[Tuple[torch.Tensor, float]]:
        with torch.no_grad():
            outputs = self.model(tokens)
        next_token_logits = outputs.logits[:, -1, :]
        scaled_logits = next_token_logits / temperature
        probabilities = torch.nn.functional.softmax(scaled_logits, dim=-1)
        samples = torch.multinomial(probabilities, num_samples=k)
        selected_probabilities = [prob.item() for prob in probabilities[0, samples][0]]

        top_k_with_prob = sorted(
            zip(samples[0], selected_probabilities), key=lambda x: x[1], reverse=True
        )
        return top_k_with_prob

    def generate_with_alt(
        self, original_prompt: str, max_length: int = None, max_new_tokens: int = 100, k: int = 10, temperature: float = 1.0
    ) -> List[List[Tuple[str, float]]]:
        prompt_tokens = self.tokenizer.encode(original_prompt, return_tensors="pt").to(
            self.device
        )
        result = [[(token, 1.0)] for token in prompt_tokens[0]]
        if max_length:
            max_new_tokens = max_length - len(prompt_tokens[0])
        for _ in range(max_new_tokens):
            top_k_with_prob = self.generate_top_k_token_with_prob(prompt_tokens, k, temperature)
            result.append(top_k_with_prob)
            prompt_tokens = torch.tensor([[item[0][0] for item in result]]).to(
                self.device
            )

            # Check for eos token
            if prompt_tokens[0][-1] == self.tokenizer.eos_token_id:
                break
        # Remove beginning of text token if it exists
        if result[0][0][0] == self.tokenizer.bos_token_id:
            result = result[1:]
        return [
            [(self.tokenizer.decode(token), prob) for token, prob in alt_token_pairs]
            for alt_token_pairs in result
        ]
