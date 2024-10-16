from transformers import AutoModelForCausalLM, AutoTokenizer


class TextGenerationService:
    def __init__(self, storage_path):
        self.model = AutoModelForCausalLM.from_pretrained(storage_path, device_map="auto")
        self.tokenizer = AutoTokenizer.from_pretrained(storage_path)

    def generate_text(self, prompt: str, max_length: int = 50) -> str:
        inputs = self.tokenizer(prompt, return_tensors="pt", max_length=512, truncation=True)
        outputs = self.model.generate(**inputs, max_length=max_length, num_return_sequences=1)
        return self.tokenizer.decode(outputs[0], skip_special_tokens=True)