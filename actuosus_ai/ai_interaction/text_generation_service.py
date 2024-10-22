import os
from typing import Tuple, List, Optional, Any, Generator

import torch
from llama_cpp import Llama, llama_get_logits
from torch import Tensor
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
import numpy as np

from actuosus_ai.ai_model_manager.ai_model_storage_service import AIModelStorageService
from actuosus_ai.common.actuosus_exception import NotFoundException, ValidationException
from actuosus_ai.common.utils import get_memory_footprint


class TextGenerationService:

    def __init__(self, storage_service: AIModelStorageService):
        self.storage_service = storage_service
        self.model: Any = None
        self.tokenizer: Any = None
        self.device = None
        self.model_name = ""
        self.gguf = False
        self.estimated_ram = 0.0
        self.estimated_vram = 0.0

    async def load_model(
        self, ai_model_id: int, quantization: Optional[str] = None, gguf_file_name: Optional[str] = None) -> None:
        initial_ram, initial_vram = get_memory_footprint()
        dto = await self.storage_service.get_model_by_id(ai_model_id)
        if not dto:
            raise NotFoundException(f"Model with id {ai_model_id} not found")
        self.model_name = dto.name
        match quantization:
            case "gguf":
                if not gguf_file_name:
                    raise ValidationException("gguf_file_name must be provided when loading a GGUF model")
                self.model = Llama(model_path=os.path.join(dto.storage_path, gguf_file_name), n_gpu_layers=-1)
                self.tokenizer = self.model.tokenizer()
                self.gguf = True

            case "int4":
                quant_config = BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_compute_dtype=torch.float16)
                self.model = AutoModelForCausalLM.from_pretrained(
                    dto.storage_path, quantization_config=quant_config, device_map="auto"
                )
                self.tokenizer = AutoTokenizer.from_pretrained(dto.storage_path)

            case "int8":
                quant_config = BitsAndBytesConfig(load_in_8bit=True, bnb_4bit_compute_dtype=torch.float16)
                self.model = AutoModelForCausalLM.from_pretrained(
                    dto.storage_path, quantization_config=quant_config, device_map="auto"
                )
                self.tokenizer = AutoTokenizer.from_pretrained(dto.storage_path)

            case "float16":
                self.model = AutoModelForCausalLM.from_pretrained(
                    dto.storage_path, torch_dtype=torch.float16, device_map="auto"
                )
                self.tokenizer = AutoTokenizer.from_pretrained(dto.storage_path)

            case _:
                self.model = AutoModelForCausalLM.from_pretrained(
                    dto.storage_path, device_map="auto"
                )
                self.tokenizer = AutoTokenizer.from_pretrained(dto.storage_path)
        if not self.gguf:
            self.device = self.model.device
        final_ram, final_vram = get_memory_footprint()
        self.estimated_ram = final_ram - initial_ram
        self.estimated_vram = final_vram - initial_vram

    def generate_top_k_token_with_prob(
        self, tokens: Tensor, k: int = 10, temperature: float = 1.0, prob_cutoff: Optional[float] = None
    ) -> List[Tuple[torch.Tensor, float]]:
        if self.gguf:
            self.model.reset()
            self.model.eval(tokens[0])
            logits_ptr = llama_get_logits(self.model.ctx)
            next_token_logits = torch.tensor(np.array([np.ctypeslib.as_array(logits_ptr, shape=(1, self.model.n_vocab()))[-1]]))
        else:
            with torch.no_grad():
                outputs = self.model(tokens.to(self.device))
            next_token_logits = outputs.logits[:, -1, :]
        scaled_logits = next_token_logits / temperature
        probabilities = torch.nn.functional.softmax(scaled_logits, dim=-1)
        if prob_cutoff:
            probabilities = torch.where(probabilities > prob_cutoff, probabilities, torch.tensor(0.0))

        # Sample from the filtered probabilities
        samples = torch.multinomial(probabilities, num_samples=k)
        selected_probabilities = [prob.item() for prob in probabilities[0, samples][0]]

        top_k_with_prob = sorted(
            zip(samples[0], [prob for prob in selected_probabilities if prob > 0]), key=lambda x: x[1], reverse=True
        )
        return top_k_with_prob

    def generate_with_alt(
        self,
        original_prompt: str,
        max_length: Optional[int] = None,
        max_new_tokens: int = 50,
        k: int = 10,
        temperature: float = 1.0,
    ) -> Generator[List[Tuple[str, float]], None, None]:
        if self.gguf:
            prompt_tokens = torch.tensor([self.tokenizer.encode(original_prompt)])
        else:
            prompt_tokens = self.tokenizer.encode(original_prompt, return_tensors="pt").to(
                self.device
            )
        for _ in range(max_new_tokens):
            top_k_with_prob = self.generate_top_k_token_with_prob(
                prompt_tokens, k=k, temperature=temperature, prob_cutoff=0.001
            )
            # Check for eos token
            if not self.gguf and top_k_with_prob[0][0] == self.tokenizer.eos_token_id:
                break

            # yield the newly generated line
            if self.gguf:
                yield [(self.tokenizer.decode([token]), prob) for token, prob in top_k_with_prob]
            else:
                yield [
                    (self.tokenizer.decode(token), prob) for token, prob in top_k_with_prob
                ]

            # Prepare the input for the next iteration
            prompt_tokens = torch.cat(
                (prompt_tokens, top_k_with_prob[0][0].view(1, 1)), dim=1
            )