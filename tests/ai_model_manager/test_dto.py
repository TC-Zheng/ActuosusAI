from datetime import datetime

import pytest
from pydantic import ValidationError

from actuosus_ai.ai_model_manager.dto import AIModelDTO


class TestLLM:
    @pytest.fixture
    def example_fields(self):
        return {
            "ai_model_id": 1,
            "name": "some name 1",
            "storage_path": "some storage path 1",
            "pipeline_tag": "some pipeline tag 1",
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        }

    def test_create_new_model_success(self, example_fields):
        model = AIModelDTO(**example_fields)
        assert model.name == "some name 1"

    def test_create_new_model_with_missing_fields_error(self, example_fields):
        del example_fields["name"]
        with pytest.raises(ValidationError):
            AIModelDTO(**example_fields)

    def test_create_new_model_with_empty_name_error(self, example_fields):
        example_fields["name"] = ""
        with pytest.raises(ValidationError):
            AIModelDTO(**example_fields)

    def test_immutable_fields_error(self, example_fields):
        model = AIModelDTO(**example_fields)
        model.name = "some name 2"  # No error
        with pytest.raises(ValidationError):
            model.ai_model_id = 2
        with pytest.raises(ValidationError):
            model.created_at = datetime.now()
