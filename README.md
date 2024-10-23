# ActuosusAI

![Demo](https://github.com/user-attachments/assets/fcdffccc-391d-4aa5-9aeb-044f184d33db)

*A quick demo showcasing the main feature of the project.*

![Full Video](https://github.com/user-attachments/assets/6eab937c-9d02-4f4a-9e7d-cd33ceebff58)

*A detailed walkthrough of the entire app.*

## Table of Contents
- [Features](#features)
- [Installation Guide](#installation-guide)
  - [Quick Start with Docker](#quick-start-with-docker)
  - [Manual Installation (Without Docker)](#manual-installation-without-docker)
    - [Prerequisites](#prerequisites)
    - [Installation Steps](#installation-steps)
- [Development](#development)
- [Roadmap](#roadmap)
- [About the Project](#about-the-project)

## Features
- **Download and manage models** from Hugging Face.
- **Support for GGUF models** and load models in up to **4-bit quantization**.
- **Chat interface** that supports alternative tokens.
- Model interaction is simple and efficient.

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
   - For example, try downloading and chatting with the `gpt2` model:
     ```bash
     openai-community/gpt2
     ```

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

Refer to the Docker Compose files for how to set up the project manually. But it's basically a standard python poetry project and next.js project with the gpu support requiring installing a few extra things.

## Development

The Docker setup automatically mounts the project folder into the container. Any changes made to the local project will be reflected in the container. This allows for seamless development without needing to install dependencies locally. Simply run the container and develop within the environment.

## Roadmap
- [x] Add Docker support and streamline the app's usability.
- [ ] Allow users to add existing local models to the app.
- [ ] Enable chatting with instruction-tuned models.
- [ ] I'm open to feature requests—feel free to suggest improvements!
## About the Project

This is a personal hobby project aimed at experimenting with machine learning models and honing web development skills. I'm continuously adding new features and enhancing existing ones. Some ideas I'm planning to explore include:
- **Dataset management** for seamless model training.
- **Training/finetuning management** with detailed history and logs.
- Adding **memory options** such as RAG (retrieval-augmented generation) or finetuning.
- Expanding **model support** to include vision/multi-modal models and interactions with multiple models simultaneously.
- And much more!