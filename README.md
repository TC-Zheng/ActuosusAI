# ActuosusAI
![chat-ezgif com-video-to-gif-converter](https://github.com/user-attachments/assets/28a7993b-760b-4cf4-a715-94cc3caa43ba)


*A quick demo showcasing the main feature of the project.*

## Table of Contents
- [Features](#features)
- [Installation Guide](#installation-guide)
  - [Quick Start with Docker](#quick-start-with-docker)
- [Development](#development)
- [Roadmap](#roadmap)
- [About the Project](#about-the-project)

## Features
- **Download and manage models** from Hugging Face.
- **Support for GGUF models** and load models in up to **4-bit quantization** on GPU.
- **Chat interface** that let you explore alternative paths the AI could take.

## Installation Guide

### Quick Start with Docker

1. **Install [Docker](https://www.docker.com/)**:
   - **Windows**: Ensure Docker Desktop is running. For GPU support, set up **WSL2** and **CUDA-compatible NVIDIA drivers**.
   - **Linux/macOS**: Install Docker and ensure NVIDIA drivers are present if you want GPU support.

2. **Clone the repository**:
   ```bash
   git clone https://github.com/TC-Zheng/ActuosusAI.git
   ```

3. **Navigate to the project directory**:
   ```bash
   cd ActuosusAI
   ```

4. **(Optional) Add a Hugging Face token**:
   - Create a `.env` file if it doesn't exist, and add your token if downloading models that require authentication.
   - Add this line to the `.env`:
     ```bash
     huggingface_token="your_token_here"
     ```

5. **Run the appropriate Docker Compose command**:
   - Without an Nvidia GPU:
     ```bash
     docker-compose -f docker-compose-cpu.yml up --build
     ```
   - With Nvidia GPU (and CUDA drivers):
     ```bash
     docker-compose -f docker-compose-gpu.yml up --build
     ```

6. **Access the app in your browser**:
   - Open [http://localhost:3000](http://localhost:3000) to interact with the app.

7. **Start chatting with a model**:
   - Go to [Hugging Face](https://huggingface.co/models?pipeline_tag=text-generation&sort=trending), pick your desired model, get the access to the model if required, and search it inside the app then click Download.

8. **Subsequent runs**:
   - To start the app without rebuilding:
     ```bash
     docker-compose -f docker-compose-cpu.yml up
     ```
     or
     ```bash
     docker-compose -f docker-compose-gpu.yml up
     ```

### Manual Installation (Without Docker)

Refer to the Docker Compose files for how to set up the project manually. It's basically a standard python poetry and next.js project with the gpu support requiring installing a few extra things.

## Development

The Docker setup automatically mounts the project folder into the container. Any changes made to the local project will be reflected in the container. This allows for seamless development without needing to install dependencies locally. Simply run the container and develop within the environment.

## Roadmap
- [x] Add Docker support and streamline the app's usability.
- [x] Enable chatting with instruction-tuned models.
- [ ] Make this an electron app and allow users to add existing local models to the app.
- [ ] I'm open to feature requests—feel free to suggest improvements!
## About the Project

This is a personal hobby project aimed at experimenting with machine learning models and honing web development skills. I'm continuously adding new features and enhancing existing ones. Some ideas I'm planning to explore include:
- Dataset management
- Training/finetuning management with history and versioning.
- RAG support
- Lora finetuning instead of RAG for long-term memory.
- Multi-modal
- Multiple agents working together.
- And much more!
