import traceback
from typing import Any

from fastapi import Request

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from actuosus_ai.common.actuosus_exception import ActuosusException, NotFoundException


class CustomExceptionMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Any) -> Any:
        try:
            response = await call_next(request)
        except ActuosusException as exc:
            traceback.print_exc()
            code = 500
            if isinstance(exc, NotFoundException):
                code = 404
            return JSONResponse(
                status_code=code,
                content={"success": False, "message": str(exc)},
            )
        except Exception as exc:
            traceback.print_exc()
            return JSONResponse(
                status_code=500,
                content={"success": False, "message": str(exc)},
            )
        return response
