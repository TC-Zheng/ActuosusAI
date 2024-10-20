import psutil
import pynvml

def get_memory_footprint() -> tuple[float, float]:
    # Initialize pynvml to interact with NVIDIA GPUs
    pynvml.nvmlInit()

    # Get system RAM usage
    ram_info = psutil.virtual_memory()
    used_ram_gb = ram_info.used / (1024 ** 3)  # Convert bytes to GB

    # Get VRAM usage for all detected GPUs
    total_vram_used_gb = 0
    device_count = pynvml.nvmlDeviceGetCount()

    for i in range(device_count):
        handle = pynvml.nvmlDeviceGetHandleByIndex(i)
        vram_info = pynvml.nvmlDeviceGetMemoryInfo(handle)
        total_vram_used_gb += vram_info.used / (1024 ** 3)  # Convert bytes to GB


    return used_ram_gb, total_vram_used_gb