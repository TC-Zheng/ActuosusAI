import psutil
from jinja2 import Environment, BaseLoader, TemplateSyntaxError

try:
    import pynvml

    pynvml_available = True
except ImportError:
    pynvml = None
    pynvml_available = False


def get_memory_footprint() -> tuple[float, float]:
    # Initialize pynvml to interact with NVIDIA GPUs if available
    if pynvml_available:
        try:
            pynvml.nvmlInit()
            gpu_available = True
        except pynvml.NVMLError:
            gpu_available = False
    else:
        gpu_available = False

    # Get system RAM usage
    ram_info = psutil.virtual_memory()
    used_ram_gb = ram_info.used / (1024**3)  # Convert bytes to GB

    # Check for GPU availability
    if gpu_available:
        # Get VRAM usage for all detected GPUs
        total_vram_used_gb = 0
        device_count = pynvml.nvmlDeviceGetCount()

        for i in range(device_count):
            handle = pynvml.nvmlDeviceGetHandleByIndex(i)
            vram_info = pynvml.nvmlDeviceGetMemoryInfo(handle)
            total_vram_used_gb += vram_info.used / (1024**3)  # Convert bytes to GB
    else:
        total_vram_used_gb = (
            0  # Return 0 if no GPU is available or pynvml is not installed
        )

    return used_ram_gb, total_vram_used_gb


eot_tokens = ["<|im_end|>:", "</s>", "<|eot_id|>", "<|END_OF_TURN_TOKEN|>", "[/INST]", "[/TURN]", "<|endoftext|>", "[EOS]", "[EOT]", "<eos>"]
def remove_trailing_eot_token(text: str) -> str:
    # Strip any trailing whitespace
    stripped_text = text.rstrip()

    # Check if the stripped text ends with any of the eot tokens
    for eot in eot_tokens:
        if stripped_text.endswith(eot):
            # If it ends with an eot token, remove it
            return stripped_text[: -len(eot)].rstrip()

    # If no eot token is found, return the original text (with trailing whitespace removed)
    return stripped_text

env = Environment(loader=BaseLoader())

def parse_messages(jinja2_template, messages):
    try:
        template = env.from_string(jinja2_template)
        return remove_trailing_eot_token(template.render({'messages': messages}))
    except TemplateSyntaxError as e:
        return f"Template error: {str(e)}"