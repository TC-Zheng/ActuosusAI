import asyncio
import os
import shutil
import uuid
from typing import Optional, List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from transformers import PreTrainedModel, PreTrainedTokenizer

from actuosus_ai.ai_model_manager.dto import LanguageModelDTO
from actuosus_ai.ai_model_manager.orm import LanguageModelORM
from actuosus_ai.common.actuosus_exception import InternalException
from actuosus_ai.common.settings import Settings


class LanguageModelService:
    def __init__(self, settings: Settings, async_session: AsyncSession):
        self.settings = settings
        self.async_session = async_session

    @staticmethod
    def _dto_to_orm(dto: LanguageModelDTO) -> LanguageModelORM:
        return LanguageModelORM(**dto.model_dump())

    @staticmethod
    def _orm_to_dto(orm: LanguageModelORM) -> LanguageModelDTO:
        return LanguageModelDTO(**orm.__dict__)

    async def add_new_model(
        self, name: str, model: PreTrainedModel, tokenizer: PreTrainedTokenizer
    ) -> None:
        try:
            storage_path = os.path.join(
                self.settings.base_file_storage_path, str(uuid.uuid4())
            )
            # Save model and tokenizer to storage
            loop = asyncio.get_running_loop()
            temp_path = storage_path + "_temp"
            await asyncio.gather(
                loop.run_in_executor(None, model.save_pretrained, temp_path),
                loop.run_in_executor(None, tokenizer.save_pretrained, temp_path),
            )
            # Save model to database
            self.async_session.add(
                LanguageModelORM(
                    name=name,
                    storage_path=storage_path,
                )
            )

            await self.async_session.commit()
            await asyncio.get_running_loop().run_in_executor(
                None, lambda: shutil.rmtree(storage_path, ignore_errors=True)
            )
            shutil.move(temp_path, storage_path)

        except Exception as e:
            # Rollback session and delete storage
            loop = asyncio.get_running_loop()
            await asyncio.gather(
                loop.run_in_executor(
                    None, lambda: shutil.rmtree(temp_path, ignore_errors=True)
                ),
                self.async_session.rollback(),
            )
            raise InternalException(str(e))

    async def update_model(
        self,
        dto: LanguageModelDTO,
        model: PreTrainedModel,
        tokenizer: PreTrainedTokenizer,
    ) -> None:
        try:
            # Save everything
            loop = asyncio.get_running_loop()
            temp_path = dto.storage_path + "_temp"
            await asyncio.gather(
                loop.run_in_executor(None, model.save_pretrained, temp_path),
                loop.run_in_executor(None, tokenizer.save_pretrained, temp_path),
                self.async_session.merge(self._dto_to_orm(dto)),
            )

            await self.async_session.commit()
            await asyncio.get_running_loop().run_in_executor(
                None, lambda: shutil.rmtree(dto.storage_path, ignore_errors=True)
            )
            shutil.move(temp_path, dto.storage_path)

        except Exception as e:
            # Rollback session and delete storage
            await asyncio.gather(
                asyncio.get_running_loop().run_in_executor(
                    None, lambda: shutil.rmtree(temp_path, ignore_errors=True)
                ),
                self.async_session.rollback(),
            )
            raise InternalException(str(e))

    async def get_model_by_id(self, lm_id: int) -> Optional[LanguageModelDTO]:
        try:
            query = await self.async_session.execute(
                select(LanguageModelORM).filter(LanguageModelORM.lm_id == lm_id)
            )
            orm = query.scalar_one_or_none()
            return self._orm_to_dto(orm) if orm else None
        except Exception as e:
            raise InternalException(str(e))

    async def get_models(self, limit: int) -> List[LanguageModelDTO]:
        try:
            query = await self.async_session.execute(
                select(LanguageModelORM).limit(limit)
            )
            return [self._orm_to_dto(orm) for orm in query.scalars()]
        except Exception as e:
            raise InternalException(str(e))

    async def get_all_models(self) -> List[LanguageModelDTO]:
        try:
            query = await self.async_session.execute(select(LanguageModelORM))
            return [self._orm_to_dto(orm) for orm in query.scalars()]
        except Exception as e:
            raise InternalException(str(e))

    async def delete_model_by_id(self, lm_id: int) -> None:
        try:
            model = await self.get_model_by_id(lm_id)
            if model:
                await self.async_session.delete(model)
                await self.async_session.commit()
                await asyncio.get_running_loop().run_in_executor(
                    None, lambda: shutil.rmtree(model.storage_path, ignore_errors=True)
                )
        except Exception as e:
            raise InternalException(str(e))
