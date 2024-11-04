import os
from typing import Tuple, List, Optional, Any, Generator, Dict

import torch
from llama_cpp import Llama, llama_get_logits
from torch import Tensor
from transformers import AutoModelForCausalLM, AutoTokenizer

try:
    from transformers import BitsAndBytesConfig

    bitsandbytes_available = True
except ImportError:
    BitsAndBytesConfig = None
    bitsandbytes_available = False

import numpy as np

from actuosus_ai.ai_model_manager.ai_model_storage_service import AIModelStorageService
from actuosus_ai.common.actuosus_exception import NotFoundException, ValidationException
from actuosus_ai.common.utils import get_memory_footprint

WordProbList = List[Tuple[str, float]]


class TextGenerationService:
    def __init__(self, storage_service: AIModelStorageService):
        self.storage_service = storage_service
        self.model: Any = None
        self.tokenizer: Any = None
        self.device = None
        self.ai_model_name = ""
        self.gguf = False
        self.estimated_ram = 0.0
        self.estimated_vram = 0.0
        self.max_length = 8192
        self.end_with_eos = False

    async def load_model(
        self,
        ai_model_id: int,
        quantization: Optional[str] = None,
        gguf_file_name: Optional[str] = None,
    ) -> None:
        initial_ram, initial_vram = get_memory_footprint()
        dto = await self.storage_service.get_model_by_id(ai_model_id)
        if not dto:
            raise NotFoundException(f"Model with id {ai_model_id} not found")
        self.ai_model_name = dto.name

        # Without gpu, pytorch only supports bfloat16
        if not torch.cuda.is_available() and quantization in (
            "int8",
            "int4",
            "float16",
        ):
            quantization = "bfloat16"

        match quantization:
            case "gguf":
                if not gguf_file_name:
                    raise ValidationException(
                        "gguf_file_name must be provided when loading a GGUF model"
                    )
                self.model = Llama(
                    model_path=os.path.join(dto.storage_path, gguf_file_name),
                    n_gpu_layers=-1,
                    n_ctx=0
                )
                self.tokenizer = self.model.tokenizer()
                self.gguf = True

            case "int4":
                quant_config = BitsAndBytesConfig(
                    load_in_4bit=True, bnb_4bit_compute_dtype=torch.float16
                )
                self.model = AutoModelForCausalLM.from_pretrained(
                    dto.storage_path,
                    quantization_config=quant_config,
                    device_map="auto",
                )
                self.tokenizer = AutoTokenizer.from_pretrained(dto.storage_path)

            case "int8":
                quant_config = BitsAndBytesConfig(
                    load_in_8bit=True, bnb_4bit_compute_dtype=torch.float16
                )
                self.model = AutoModelForCausalLM.from_pretrained(
                    dto.storage_path,
                    quantization_config=quant_config,
                    device_map="auto",
                )
                self.tokenizer = AutoTokenizer.from_pretrained(dto.storage_path)

            case "float16":
                self.model = AutoModelForCausalLM.from_pretrained(
                    dto.storage_path, torch_dtype=torch.float16, device_map="auto"
                )
                self.tokenizer = AutoTokenizer.from_pretrained(dto.storage_path)

            case "bfloat16":
                self.model = AutoModelForCausalLM.from_pretrained(
                    dto.storage_path, torch_dtype=torch.bfloat16, device_map="auto"
                )
                self.tokenizer = AutoTokenizer.from_pretrained(dto.storage_path)
            case _:
                self.model = AutoModelForCausalLM.from_pretrained(
                    dto.storage_path, device_map="auto"
                )
                self.tokenizer = AutoTokenizer.from_pretrained(dto.storage_path)

        if not self.gguf:
            self.device = self.model.device
            self.max_length = self.tokenizer.model_max_length
        else:
            self.max_length = self.model.n_ctx()
        final_ram, final_vram = get_memory_footprint()
        self.estimated_ram = final_ram - initial_ram
        self.estimated_vram = final_vram - initial_vram

    @staticmethod
    def _generate_top_k_token_with_prob(
        logits: Tensor, k: int, temperature: float, min_prob: float
    ) -> List[Tuple[torch.Tensor, float]]:
        scaled_logits = logits / temperature
        probabilities = torch.nn.functional.softmax(scaled_logits, dim=-1)
        probabilities = torch.where(
            probabilities > min_prob, probabilities, torch.tensor(0.0)
        )

        # Sample from the filtered probabilities
        samples = torch.multinomial(probabilities, num_samples=k)
        selected_probabilities = [prob.item() for prob in probabilities[0, samples][0]]

        # Leave the first element as is, sort the rest by probability so that the answer is more varied
        first_element = samples[0][0], selected_probabilities[0]
        remaining_elements = sorted(
            zip(samples[0][1:], [prob for prob in selected_probabilities[1:] if prob > 0]),
            key=lambda x: x[1],
            reverse=True,
        )
        top_k_with_prob = [first_element] + remaining_elements
        return top_k_with_prob

    def generate_tokens_with_probabilities_gguf(
        self,
        prompt: str | List[Dict[str, str]],
        max_length: Optional[int],
        max_new_tokens: Optional[int],
        k: int,
        temperature: float,
        min_prob: float,
        is_chat: bool = False,
    ) -> Generator[WordProbList, None, None]:
        self.model.reset()
        prompt_tokens = self.tokenizer.encode(prompt)
        if max_length:
            max_new_tokens = max_length - len(prompt_tokens)
        for _ in range(max_new_tokens):
            self.model.eval(prompt_tokens)
            logits_ptr = llama_get_logits(self.model.ctx)
            next_token_logits = torch.tensor(
                np.array(
                    [
                        np.ctypeslib.as_array(
                            logits_ptr, shape=(1, self.model.n_vocab())
                        )[-1]
                    ]
                )
            )
            top_k_with_prob = self._generate_top_k_token_with_prob(
                next_token_logits, k=k, temperature=temperature, min_prob=min_prob
            )
            # Check for eos token
            if top_k_with_prob[0][0].item() == self.model.token_eos():
                self.end_with_eos = True
                break

            prompt_tokens = top_k_with_prob[0][0].view(1, 1)

            # yield the newly generated line
            yield [
                (self.tokenizer.decode([token]), prob)
                for token, prob in top_k_with_prob
            ]

    def generate_tokens_with_probabilities_hf(
        self,
        prompt: str,
        max_length: Optional[int],
        max_new_tokens: int,
        k: int,
        temperature: float,
        min_prob: float,
    ) -> Generator[WordProbList, None, None]:
        prompt_tokens = self.tokenizer.encode(prompt, return_tensors="pt").to(
            self.device
        )
        if max_length:
            max_new_tokens = max_length - len(prompt_tokens[0])
        for _ in range(max_new_tokens):
            with torch.no_grad():
                outputs = self.model(prompt_tokens)
            next_token_logits = outputs.logits[:, -1, :]
            top_k_with_prob = self._generate_top_k_token_with_prob(
                next_token_logits, k=k, temperature=temperature, min_prob=min_prob
            )
            # Process output
            del outputs
            torch.cuda.empty_cache()

            # Check for eos token
            if top_k_with_prob[0][0].item() == self.tokenizer.eos_token_id:
                self.end_with_eos = True
                break

            # yield the newly generated line
            yield [
                (self.tokenizer.decode(token), prob) for token, prob in top_k_with_prob
            ]

            # Prepare the input for the next iteration
            prompt_tokens = torch.cat(
                (prompt_tokens, top_k_with_prob[0][0].view(1, 1)), dim=1
            )

    def generate_tokens_with_probabilities(
        self,
        prompt: str,
        max_length: Optional[int] = None,
        max_new_tokens: int = 50,
        k: int = 10,
        temperature: float = 1.0,
        min_prob: float = 0.001,
    ) -> Generator[WordProbList, None, None]:
        self.end_with_eos = False
        if self.gguf:
            yield from self.generate_tokens_with_probabilities_gguf(
                prompt=prompt,
                max_length=max_length,
                max_new_tokens=max_new_tokens,
                k=k,
                temperature=temperature,
                min_prob=min_prob,
            )
        else:
            yield from self.generate_tokens_with_probabilities_hf(
                prompt=prompt,
                max_length=max_length,
                max_new_tokens=max_new_tokens,
                k=k,
                temperature=temperature,
                min_prob=min_prob,
            )
