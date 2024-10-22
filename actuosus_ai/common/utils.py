import psutil
import pynvml

def get_memory_footprint() -> tuple[float, float]:
    # Initialize pynvml to interact with NVIDIA GPUs
    try:
        pynvml.nvmlInit()
        gpu_available = True
    except pynvml.NVMLError:
        gpu_available = False

    # Get system RAM usage
    ram_info = psutil.virtual_memory()
    used_ram_gb = ram_info.used / (1024 ** 3)  # Convert bytes to GB

    # Check for GPU availability
    if gpu_available:
        # Get VRAM usage for all detected GPUs
        total_vram_used_gb = 0
        device_count = pynvml.nvmlDeviceGetCount()

        for i in range(device_count):
            handle = pynvml.nvmlDeviceGetHandleByIndex(i)
            vram_info = pynvml.nvmlDeviceGetMemoryInfo(handle)
            total_vram_used_gb += vram_info.used / (1024 ** 3)  # Convert bytes to GB
    else:
        total_vram_used_gb = 0  # Return 0 if no GPU is available

    return used_ram_gb, total_vram_used_gb
