import time
from typing import Dict
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class CachedResponseData:
    def __init__(self, status_code: int, headers: Dict[str, str], body: bytes, created_at: float):
        self.status_code = status_code
        self.headers = headers
        self.body = body
        self.created_at = created_at


class IdempotencyMiddleware(BaseHTTPMiddleware):

    def __init__(self, app, ttl_seconds: int = 86400):
        super().__init__(app)
        self.ttl_seconds = ttl_seconds
        self.cache: Dict[str, CachedResponseData] = {}

    def _clean_stale_entries(self, current_time: float):
        cutoff = current_time - self.ttl_seconds
        for k in [k for k, v in self.cache.items() if v.created_at < cutoff]:
            del self.cache[k]

    async def dispatch(self, request: Request, call_next) -> Response:
        idempotency_key = request.headers.get("Idempotency-Key") or request.headers.get("X-Idempotency-Key")

        if not idempotency_key or request.method not in ("POST", "PATCH", "PUT"):
            return await call_next(request)

        current_time = time.time()
        self._clean_stale_entries(current_time)

        if idempotency_key in self.cache:
            cached = self.cache[idempotency_key]
            response_headers = {**cached.headers, "X-Cache-Hit": "true", "X-Idempotency-Key": idempotency_key}
            return Response(
                content=cached.body,
                status_code=cached.status_code,
                headers=response_headers,
                media_type=cached.headers.get("content-type"),
            )

        response = await call_next(request)
        body_bytes = b"".join([section async for section in response.body_iterator])

        if 200 <= response.status_code < 300:
            self.cache[idempotency_key] = CachedResponseData(
                status_code=response.status_code,
                headers={
                    k: v for k, v in response.headers.items()
                    if k.lower() not in ("content-length", "content-encoding", "transfer-encoding")
                },
                body=body_bytes,
                created_at=current_time,
            )

        return Response(
            content=body_bytes,
            status_code=response.status_code,
            headers={**dict(response.headers), "X-Idempotency-Key": idempotency_key},
            media_type=response.media_type,
        )
