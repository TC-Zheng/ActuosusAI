from fastapi import FastAPI
import uvicorn
from starlette.middleware.cors import CORSMiddleware

from actuosus_ai.app.ai_router import router as ai_router
from actuosus_ai.app.exception_handler import CustomExceptionMiddleware

app = FastAPI()
app.include_router(ai_router)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

app.add_middleware(CustomExceptionMiddleware)

if __name__ == "__main__":
    uvicorn.run(app, port=8000)
    # http://127.0.0.1:8000/docs to see the Swagger UI
