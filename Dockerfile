FROM node:20.18.0

# Set working directory for frontend
WORKDIR /app

# Copy the Next.js app files
COPY ./frontend/package*.json .

# Install Node.js dependencies
RUN npm install

# Copy the rest of the Next.js app
COPY ./frontend .

# TEMPORARY:
# Set environment variable to skip ESLint during build
ENV NEXT_IGNORE_ESLINT=true
ENV TSC_COMPILE_ON_ERROR=true
ENV ESLINT_NO_DEV_ERRORS=true

# Build the frontend
RUN npm run build

ENV DEBIAN_FRONTEND=noninteractive

# Install necessary build tools for llama-cpp-python
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install system dependencies
RUN apt-get update && apt-get install -y \
    software-properties-common \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Manually add the deadsnakes PPA
RUN echo "deb http://ppa.launchpad.net/deadsnakes/ppa/ubuntu jammy main" > /etc/apt/sources.list.d/deadsnakes-ppa.list \
    && apt-key adv --keyserver keyserver.ubuntu.com --recv-keys BA6932366A755776 \
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
RUN pip install poetry

# Copy the Python project files
COPY backend/pyproject.toml backend/poetry.lock ./
# Install dependencies
RUN poetry config virtualenvs.create false && \
    poetry install --no-dev
# Copy the rest of the backend project
COPY backend/ ./

# Install project itself
RUN poetry install

# Set the PYTHONPATH environment variable
ENV PYTHONPATH="${PYTHONPATH}:/app/actuosus_ai"

# Copy the .env and local files
COPY .env ./
COPY run.sh ./
# Expose the port Next.js will run on
RUN apt-get update && apt-get install -y nodejs npm nginx && \
    rm -rf /var/lib/apt/lists/*
# Copy Nginx configuration
COPY ./nginx.conf /etc/nginx/nginx.conf

# Expose environment variables
ENV HOST 0.0.0.0
ENV FRONTEND_PORT 3000
ENV BACKEND_PORT 8000

# Expose port for Nginx
EXPOSE 7860
## Install concurrently globally
RUN chmod +x run.sh
CMD ["bash", "run.sh"]
# Run by docker run -p 7860:80 docker-image-name