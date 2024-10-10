import pytest
from fastapi import FastAPI
from starlette.testclient import TestClient

from actuosus_ai.app.exception_handler import CustomExceptionMiddleware
from actuosus_ai.common.actuosus_exception import ActuosusException, NotFoundException

# Define a simple FastAPI app for testing purposes
app = FastAPI()
app.add_middleware(CustomExceptionMiddleware)


# Example route for testing
@app.get("/trigger-actuosus-exception")
async def trigger_actuosus_exception():
    raise ActuosusException("Custom exception occurred")


@app.get("/trigger-not-found-exception")
async def trigger_not_found_exception():
    raise NotFoundException("Item not found")


@app.get("/no-exception")
async def no_exception():
    return {"success": True, "message": "All good!"}


class TestCustomExceptionMiddleware:
    @pytest.fixture(scope="class")
    def client(self):
        return TestClient(app)

    def test_actuosus_exception_handled(self, client):
        response = client.get("/trigger-actuosus-exception")
        assert response.status_code == 500
        assert response.json() == {
            "success": False,
            "message": "Custom exception occurred",
        }

    def test_not_found_exception_handled(self, client):
        response = client.get("/trigger-not-found-exception")
        assert response.status_code == 404
        assert response.json() == {"success": False, "message": "Item not found"}

    def test_no_exception(self, client):
        response = client.get("/no-exception")
        assert response.status_code == 200
        assert response.json() == {"success": True, "message": "All good!"}

    def test_unexpected_exception(self, client):
        @app.get("/trigger-unexpected-exception")
        async def trigger_unexpected_exception():
            raise ValueError("Unexpected error")

        response = client.get("/trigger-unexpected-exception")
        assert response.status_code == 500
        assert response.json() == {"success": False, "message": "Unexpected error"}
