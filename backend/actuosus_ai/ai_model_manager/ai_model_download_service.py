import asyncio
import os
from typing import List

from huggingface_hub import HfApi, snapshot_download

from actuosus_ai.ai_model_manager.ai_model_storage_service import AIModelStorageService
from actuosus_ai.ai_model_manager.dto import CreateNewAIModelDTO
from actuosus_ai.common.actuosus_exception import (
    InternalException,
    NotFoundException,
    NetworkException,
)
from actuosus_ai.common.settings import Settings


class AIModelDownloadService:
    def __init__(
        self, language_model_service: AIModelStorageService, settings: Settings
    ):
        self.language_model_service = language_model_service
        self.settings = settings

    async def download_lm_from_hugging_face(self, model_name: str) -> None:
        try:
            api = HfApi()
            pipeline_tag = api.model_info(model_name).pipeline_tag
            storage_path = os.path.join(
                self.settings.base_file_storage_path, model_name
            )

            # Make sure the storage path is unique by adding a suffix
            copy_suffix = "_copy"
            original_storage_path = storage_path

            while os.path.exists(storage_path):
                storage_path = original_storage_path + copy_suffix
                copy_suffix += "_copy"

            await asyncio.get_running_loop().run_in_executor(
                None,
                lambda: snapshot_download(repo_id=model_name, local_dir=storage_path),
            )
            # Add model and tokenizer to db
            await self.language_model_service.add_new_model(
                CreateNewAIModelDTO(
                    name=model_name,
                    pipeline_tag=pipeline_tag,
                    storage_path=storage_path,
                ),
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
    async def search_hub_with_name(model_name: str, limit: int) -> List[str]:
        try:
            api = HfApi()
            return [
                model.id for model in api.list_models(search=model_name, limit=limit)
            ]
        except Exception as e:
            raise InternalException(str(e))
