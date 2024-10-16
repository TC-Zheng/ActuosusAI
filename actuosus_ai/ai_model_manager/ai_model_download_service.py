import asyncio
from typing import List

from transformers import AutoModel, AutoTokenizer
from huggingface_hub import HfApi

from actuosus_ai.ai_model_manager.ai_model_storage_service import AIModelStorageService
from actuosus_ai.ai_model_manager.dto import CreateNewAIModelDTO
from actuosus_ai.common.actuosus_exception import (
    InternalException,
    NotFoundException,
    NetworkException,
)


class AIModelDownloadService:
    def __init__(self, language_model_service: AIModelStorageService):
        self.language_model_service = language_model_service

    async def download_lm_from_hugging_face(self, model_name: str) -> None:
        try:
            loop = asyncio.get_running_loop()
            model, tokenizer = await asyncio.gather(
                loop.run_in_executor(None, AutoModel.from_pretrained, model_name),
                loop.run_in_executor(None, AutoTokenizer.from_pretrained, model_name),
            )
            api = HfApi()
            pipeline_tag = api.model_info(model_name).pipeline_tag
            # Save model and tokenizer to storage
            await self.language_model_service.add_new_model(
                CreateNewAIModelDTO(
                    name=model_name,
                    pipeline_tag=pipeline_tag,
                ),
                model,
                tokenizer,
            )

        except Exception as e:
            msg = str(e)

            if (
                "is not a local folder and is not a valid model identifier listed on 'https://huggingface.co/models'"
                in msg
            ):
                raise NotFoundException("Model not found on Hugging Face")

            elif (
                "We couldn't connect to 'https://huggingface.co' to download model"
                in msg
            ):
                raise NetworkException("Couldn't connect to Hugging Face")

            else:
                raise InternalException(msg)

    @staticmethod
    async def search_hub_with_name(model_name: str, limit: int) -> List:
        try:
            api = HfApi()
            return [model.id for model in api.list_models(search=model_name, limit=limit)]
        except Exception as e:
            raise InternalException(str(e))
