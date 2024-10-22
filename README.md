# Project Name


![Recording2024-10-20122344-ezgif com-video-to-gif-converter](https://github.com/user-attachments/assets/fcdffccc-391d-4aa5-9aeb-044f184d33db)


*A quick demo video showcasing the main feature of the project.*



![video](https://github.com/user-attachments/assets/6eab937c-9d02-4f4a-9e7d-cd33ceebff58)
A more detailed video showing the whole app

## Index
- [Features](#features)
- [Installation Guide](#installation-guide)
  - [Quick Start With Docker](#quick-start-with-docker)
  - [Install the project without Docker](#install-the-project-without-docker)
    - [Prerequisites](#prerequisites)
    - [Installation Steps](#installation-steps)
    - [GPU support for GGUF models](#gpu-support-for-gguf-models)
- [How to run the project](#how-to-run-the-project)
- [Roadmap](#roadmap)
- [What is this project](#what-is-this-project)
## Features

- Feature 1: Download and manage models from hugging face
- Feature 2: Load the models in up to 4 bit quantization
- Feature 3: Support GGUF model format
- Feature 4: Chat with the model with alternative tokens

## Installation Guide

## Quick Start With Docker
1. Install [Docker](https://www.docker.com/):
   - For **Windows users**: Ensure **Docker Desktop** is running, and if you want GPU support in Docker, you'll need to have **WSL2** set up with **CUDA-compatible NVIDIA drivers**.
   - For **Linux and macOS users**: Install Docker and ensure your NVIDIA drivers are installed if you plan to use GPU support.

2. Clone the repo:
   ```bash
   git clone https://github.com/TC-Zheng/ActuosusAI.git
3. Go to the project directory:
   ```bash
    cd ActuosusAI
4. (Optional) Add a Hugging Face token in the docker-compose-gpu.yml or docker-compose-cpu.yml file:

- Only needed if you want to download models requiring permissions.
- Open the relevant docker-compose.yml file.
- Search for HUGGINGFACE_TOKEN=.
- Add your Hugging Face token after the equal sign without any quotes.

5. Run the appropriate Docker Compose command based on your setup:

- If you If you **do not** have an Nvidia GPU:
   ```bash
   docker-compose -f docker-compose-cpu.yml up --build
    ```
- If you **do** have an Nvidia GPU and CUDA drivers installed:
    ```bash
    docker-compose -f docker-compose-gpu.yml up --build

6. Open the UI in browser:
    - Go to http://localhost:3000/ to see the app.

7. Start chatting with a model:
    - If unsure which model you want, you can start by typing this
    ```bash
    openai-community/gpt2 
    ```
    - to the download field and download this small model and chat with it.
## Install the project without Docker
### Prerequisites

- Install [Node.js](https://nodejs.org/) (v20.18.0 or higher)
- Install [npm](https://www.npmjs.com/) (v10.8.2 or higher)
- Install [Python](https://www.python.org/) (v3.12.3 or higher)

### Installation Steps

1. Clone the repo:
   ```bash
   git clone https://github.com/TC-Zheng/ActuosusAI.git
   
2. Go to the project directory:
   ```bash
   cd ActuosusAI
3. Install python dependencies via poetry:
   ```bash
   poetry install
   
4. Go the frontend directory and install frontend dependencies:
   ```bash
   cd client
   npm install

### GPU support for GGUF models
By default, the GGUF models will only be run on cpu, to run GGUF models on GPU, you need to install the llama-cpp-python package with cuda support.
1. Go to the project directory:
   ```bash
   cd ActuosusAI
2. Open poetry shell:
   ```bash
   poetry shell
   
3. Run the following command:
    ```bash
    CMAKE_ARGS="-DGGML_CUDA=on" pip install llama-cpp-python --force-reinstall --upgrade --no-cache-dir --verbose
   
### How to run the project
1. Go to the project directory:
   ```bash
   cd ActuosusAI
2. Modify the .env file:
   - Change the database_url and base_file_storage_path to your desired path.
   - Add a huggingface_token if you want to download certain models on huggingface that need permissions.

3. Run the script:
   ```bash
   ./start_dev.sh

4. Or alternatively, you can
   -  go to actuosus_ai/app and run
   ```bash
   uvicorn main:app --reload
   ```

   - go to client and run
   ```bash
   npm run dev
   ```

## Roadmap
- Feature 1: Add docker support and other things that would make this app easier to run for people.
- Feature 2: Let user able to add existing local models to use with the app.
- Feature 3: Add chatting with instruction tuned models.
- Please let me know if there are other features people like to see

## What is this project
This is a personal hobby project I have with the purpose of learning and experimenting with ML models and my web development skill.
I will be continuously adding new features and improving the existing ones. Here are some ideas of what I want to experiement on with this project:
- Dataset management
- Training/Finetuning management with history and logs.
- Memory option from either rag or finetuning
- More type of models support like vision/multi-modal, and potentially interacting with multiple models at once.
- And more
