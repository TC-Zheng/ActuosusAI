# Project Name

![Feature Demo](https://your-video-url.com)  
*A quick demo video showcasing the main feature of the project.*
## Index
- [Features](#features)
- [Installation Guide](#installation-guide)
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
   
4. Open the UI in browser:
    - Go to http://localhost:3000/ to see the app.

5. Quick start:
    - You can start by typing this
    ```bash
    openai-community/gpt2 
    ```
    - to the download field and download this small model and chat with it.

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