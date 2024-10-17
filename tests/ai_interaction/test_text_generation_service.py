from unittest.mock import patch
import pytest
import torch

from actuosus_ai.ai_interaction.text_generation_service import TextGenerationService


class TestTextGenerationService:
    @pytest.fixture
    def mocked_ai_model_storage_service(self, mocker):
        return mocker.AsyncMock()

    @pytest.mark.asyncio
    @patch("actuosus_ai.ai_interaction.text_generation_service.AutoTokenizer")
    @patch("actuosus_ai.ai_interaction.text_generation_service.AutoModelForCausalLM")
    async def test_generate_top_k_token_with_prob(
        self,
        mocked_auto_model,
        mocked_auto_tokenizer,
        mocker,
        mocked_ai_model_storage_service,
    ):
        # Mock the tokenizer and model
        mocked_model = mocker.MagicMock(name="mocked_model")
        mocked_auto_model.from_pretrained.return_value = mocked_model
        model_on_device = mocker.MagicMock(name="model_on_device")
        mocked_model.to.return_value = model_on_device
        mocked_dto = mocker.MagicMock(storage_path="dummy_path")
        mocked_ai_model_storage_service.get_model_by_id.return_value = mocked_dto

        # Create a TextGenerationService instance
        service = TextGenerationService(mocked_ai_model_storage_service)
        await service.load_model(ai_model_id=1, device="cuda")

        # Mock the model output
        mock_output = mocker.MagicMock(
            logits=torch.randn(1, 10, 50257), name="mock_output"
        )
        model_on_device.return_value = mock_output

        # Define the input tokens
        tokens = torch.tensor([[50256]])  # Example token tensor

        # Call the method
        top_k_with_prob = service.generate_top_k_token_with_prob(
            tokens, k=5, temperature=1.0
        )

        # Check the output
        assert len(top_k_with_prob) == 5
        for token, prob in top_k_with_prob:
            assert isinstance(token, torch.Tensor)
            assert isinstance(prob, float)

    @pytest.mark.asyncio
    @patch("actuosus_ai.ai_interaction.text_generation_service.AutoTokenizer")
    @patch("actuosus_ai.ai_interaction.text_generation_service.AutoModelForCausalLM")
    async def test_generate_with_alt(
        self,
        mocked_auto_model,
        mocked_auto_tokenizer,
        mocker,
        mocked_ai_model_storage_service,
    ):
        # Mock the tokenizer and model
        mocked_model = mocker.MagicMock(name="mocked_model")
        mocked_auto_model.from_pretrained.return_value = mocked_model
        model_on_device = mocker.MagicMock(name="model_on_device")
        mocked_model.to.return_value = model_on_device
        mocked_dto = mocker.MagicMock(storage_path="dummy_path")
        mocked_ai_model_storage_service.get_model_by_id.return_value = mocked_dto
        original_prompt = "Hello"

        # Mock the tokenizer output
        mocked_tokenizer = mocker.MagicMock(name="mocked_tokenizer")
        mocked_auto_tokenizer.from_pretrained.return_value = mocked_tokenizer
        mocked_tokenizer.encode.return_value = torch.tensor([[50256]])
        mocked_tokenizer.decode.side_effect = lambda x: {
            50256: "Hello",
            50257: "world",
            50258: "!",
        }.get(x, "unknown")

        # Mock the model output
        mock_output = mocker.MagicMock(
            logits=torch.randn(1, 10, 50259), name="mock_output"
        )
        model_on_device.return_value = mock_output

        # Create a TextGenerationService instance
        service = TextGenerationService(mocked_ai_model_storage_service)
        await service.load_model(ai_model_id=1, device="cuda")

        # Mock the generate_top_k_token_with_prob method
        mocker.patch.object(
            service,
            "generate_top_k_token_with_prob",
            return_value=[(torch.tensor(50257), 0.9), (torch.tensor(50258), 0.8)],
        )

        # Call the method
        result = service.generate_with_alt(original_prompt)

        # Check the output
        assert result is not None
