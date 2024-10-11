import asyncio

from transformers import AutoModel, AutoTokenizer

from actuosus_ai.ai_model_manager.language_model_service import LanguageModelService
from actuosus_ai.common.actuosus_exception import (
    InternalException,
    NotFoundException,
    NetworkException,
)


class AIModelDownloadService:
    def __init__(self, language_model_service: LanguageModelService):
        self.language_model_service = language_model_service

    async def download_lm_from_hugging_face(self, model_name: str) -> None:
        try:
            loop = asyncio.get_running_loop()
            model, tokenizer = await asyncio.gather(
                loop.run_in_executor(None, AutoModel.from_pretrained, model_name),
                loop.run_in_executor(None, AutoTokenizer.from_pretrained, model_name),
            )

            # Save model and tokenizer to storage
            await self.language_model_service.add_new_model(
                model_name, model, tokenizer
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
