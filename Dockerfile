# Stage 1: Backend (FastAPI)
FROM nvidia/cuda:12.6.2-cudnn-devel-ubuntu22.04
# Set environment variable to avoid interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# Set working directory for backend
WORKDIR /actuosus_ai

# Install necessary build tools for llama-cpp-python
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install Python 3.12
# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    POETRY_HOME="/opt/poetry" \
    POETRY_VERSION=1.6.1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    software-properties-common \
    curl \
    && add-apt-repository ppa:deadsnakes/ppa \
    && apt-get update \
    && apt-get install -y python3.12 python3.12-venv python3.12-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set Python 3.12 as the default python version
RUN update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.12 1 \
    && update-alternatives --set python3 /usr/bin/python3.12

# Install pip
RUN curl -sS https://bootstrap.pypa.io/get-pip.py | python3

# Install Poetry
RUN curl -sSL https://install.python-poetry.org | python3 -

# Add Poetry to PATH
ENV PATH="${POETRY_HOME}/bin:${PATH}"

# Copy the Python project files
COPY pyproject.toml poetry.lock ./

# Install dependencies (without dev dependencies) with retry logic globally
RUN poetry config virtualenvs.create false && \
    poetry install --no-dev --no-interaction --no-ansi || \
    (sleep 5 && poetry config virtualenvs.create false && \
     poetry install --no-dev --no-interaction --no-ansi)

# Copy the rest of the backend project
COPY actuosus_ai ./

# Install project itself
RUN poetry install

# Set the PYTHONPATH environment variable
ENV PYTHONPATH="${PYTHONPATH}:/"

# Expose the port FastAPI will run on
EXPOSE 8000

# Command to run the backend (FastAPI) server in the app folder
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]