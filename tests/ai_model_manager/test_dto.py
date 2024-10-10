from datetime import datetime

import pytest
from pydantic import ValidationError

from actuosus_ai.ai_model_manager.dto import LanguageModelDTO


class TestLLM:
    def test_create_new_llm_success(self):
        llm = LanguageModelDTO(
            lm_id=1,
            name="some name 1",
            storage_path="some storage path 1",
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        assert llm.name == "some name 1"

    def test_create_new_llm_with_missing_fields_error(self):
        with pytest.raises(ValidationError):
            LanguageModelDTO(
                lm_id=1,
                name="some name 1",
                created_at=datetime.now(),
                updated_at=datetime.now(),
            )

    def test_create_new_llm_with_empty_name_error(self):
        with pytest.raises(ValidationError):
            LanguageModelDTO(
                lm_id=1,
                name="",
                storage_path="some storage path 1",
                created_at=datetime.now(),
                updated_at=datetime.now(),
            )

    def test_immutable_fields_error(self):
        llm = LanguageModelDTO(
            lm_id=1,
            name="some name 1",
            storage_path="some storage path 1",
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        llm.name = "some name 2"  # No error
        with pytest.raises(ValidationError):
            llm.lm_id = 2
        with pytest.raises(ValidationError):
            llm.created_at = datetime.now()
