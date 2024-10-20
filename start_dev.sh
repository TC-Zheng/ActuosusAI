#!/bin/bash

# Navigate to the backend directory and start the FastAPI server
echo "Starting FastAPI backend..."
cd actuosus_ai/app || exit
uvicorn main:app --reload &

# Save the backend process ID
BACKEND_PID=$!

# Navigate to the frontend directory and start the Next.js development server
echo "Starting Next.js frontend..."
cd ../../client || exit
npm run dev &

# Save the frontend process ID
FRONTEND_PID=$!

# Function to handle script termination
function stop_servers() {
    echo "Stopping FastAPI and Next.js..."
    kill $BACKEND_PID
    kill $FRONTEND_PID
    exit
}

# Trap the script termination and stop servers
trap stop_servers SIGINT SIGTERM

# Wait for both processes to finish
wait $BACKEND_PID
wait $FRONTEND_PID