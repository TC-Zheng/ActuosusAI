import asyncio
import copy
import os
import shutil
import uuid
from typing import Optional, List, Any

from pydantic import BaseModel
from sqlalchemy import select, asc, desc
from sqlalchemy.dialects.mysql import dialect as mysql_dialect
from sqlalchemy.dialects.postgresql import dialect as postgresql_dialect
from sqlalchemy.ext.asyncio import AsyncSession

from actuosus_ai.ai_model_manager.dto import AIModelDTO, CreateNewAIModelDTO
from actuosus_ai.ai_model_manager.orm import AIModelORM
from actuosus_ai.common.actuosus_exception import InternalException, NotFoundException
from actuosus_ai.common.settings import Settings


class AIModelStorageService:
    def __init__(self, settings: Settings, async_session: AsyncSession):
        self.settings = settings
        self.async_session = async_session

    @staticmethod
    def _dto_to_orm(dto: BaseModel) -> AIModelORM:
        return AIModelORM(**dto.model_dump())

    @staticmethod
    def _orm_to_dto(orm: AIModelORM) -> AIModelDTO:
        return AIModelDTO(**orm.__dict__)

    async def add_new_model(self, new_ai_model_dto: CreateNewAIModelDTO) -> None:
        try:
            # Save model to database
            self.async_session.add(
                AIModelORM(
                    name=new_ai_model_dto.name,
                    storage_path=new_ai_model_dto.storage_path,
                    pipeline_tag=new_ai_model_dto.pipeline_tag,
                )
            )

            await self.async_session.commit()

        except Exception as e:
            # Rollback session and delete storage
            await asyncio.get_running_loop().run_in_executor(
                None,
                lambda: shutil.rmtree(
                    new_ai_model_dto.storage_path, ignore_errors=True
                ),
            )
            await self.async_session.rollback()
            raise InternalException(str(e))

    async def update_model(self, dto: AIModelDTO, *items: Any) -> None:
        try:
            # Save model to database
            await self.async_session.merge(self._dto_to_orm(dto))
            await self.async_session.commit()
            # Save model and required tokenizer, processor, etc to storage
            loop = asyncio.get_running_loop()
            tasks = [
                loop.run_in_executor(
                    None, lambda: item.save_pretrained(dto.storage_path)
                )
                for item in items
            ]
            await asyncio.gather(*tasks)

        except Exception as e:
            # Rollback session and delete storage
            await self.async_session.rollback()
            raise InternalException(str(e))

    async def get_model_by_id(self, ai_model_id: int) -> Optional[AIModelDTO]:
        try:
            query = await self.async_session.execute(
                select(AIModelORM).filter(AIModelORM.ai_model_id == ai_model_id)
            )
            orm = query.scalar_one_or_none()
            return self._orm_to_dto(orm) if orm else None
        except Exception as e:
            raise InternalException(str(e))

    async def get_models(
        self,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
        name: Optional[str] = None,
        pipeline_tag: Optional[str] = None,
        order_by: Optional[str] = None,
        is_desc: Optional[bool] = True,
    ) -> List[AIModelDTO]:
        try:
            query = select(AIModelORM)

            if limit:
                query = query.limit(limit)

            if offset:
                query = query.offset(offset)

            if name:
                # If the db is mysql or postgres, use match, otherwise use contains
                if isinstance(
                    self.async_session.bind.dialect, (mysql_dialect, postgresql_dialect)
                ):
                    query = query.filter(AIModelORM.name.match(name))
                else:
                    query = query.filter(AIModelORM.name.contains(name))

            if pipeline_tag:
                query = query.filter(AIModelORM.pipeline_tag == pipeline_tag)

            if order_by:
                if is_desc:
                    query = query.order_by(desc(AIModelORM.__dict__[order_by]))
                else:
                    query = query.order_by(asc(AIModelORM.__dict__[order_by]))

            result = await self.async_session.execute(query)

            return [self._orm_to_dto(orm) for orm in result.scalars()]

        except Exception as e:
            raise InternalException(str(e))

    async def delete_model_by_id(self, ai_model_id: int) -> None:
        try:
            query = await self.async_session.execute(
                select(AIModelORM).filter(AIModelORM.ai_model_id == ai_model_id)
            )
            model = query.scalar_one_or_none()
            if model:
                await self.async_session.delete(model)
                await self.async_session.commit()
                await asyncio.get_running_loop().run_in_executor(
                    None,
                    lambda: shutil.rmtree(str(model.storage_path), ignore_errors=True),
                )
        except Exception as e:
            raise InternalException(str(e))

    async def copy_model_by_id(self, ai_model_id: int) -> None:
        try:
            model = await self.get_model_by_id(ai_model_id)
            if model:
                new_model = copy.copy(model)
                del new_model.ai_model_id
                new_model.storage_path = os.path.join(
                    self.settings.base_file_storage_path, str(uuid.uuid4())
                )
                await asyncio.get_running_loop().run_in_executor(
                    None,
                    lambda: shutil.copytree(model.storage_path, new_model.storage_path),
                )
                self.async_session.add(self._dto_to_orm(new_model))
                await self.async_session.commit()
            else:
                raise NotFoundException("Model not found")

        except Exception as e:
            raise InternalException(str(e))

    async def get_all_gguf_files(self, ai_model_id: int) -> List[str]:
        try:
            model = await self.get_model_by_id(ai_model_id)
            if model:
                return [
                    os.path.basename(file)
                    for file in os.listdir(model.storage_path)
                    if file.endswith(".gguf")
                ]
            else:
                raise NotFoundException("Model not found")
        except Exception as e:
            raise InternalException(str(e))
