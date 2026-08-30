import time
from typing import Dict, Tuple, Optional
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, ContentStream
from starlette.types import Message


class CachedResponseData:
    def __init__(self, status_code: int, headers: Dict[str, str], body: bytes, created_at: float):
        self.status_code = status_code
        self.headers = headers
        self.body = body
        self.created_at = created_at


class IdempotencyMiddleware(BaseHTTPMiddleware):
    """Middleware that caches responses for mutating requests with an Idempotency-Key header."""

    def __init__(self, app, ttl_seconds: int = 86400):
        super().__init__(app)
        self.ttl_seconds = ttl_seconds
        # Maps idempotency_key -> CachedResponseData
        self.cache: Dict[str, CachedResponseData] = {}

    def _clean_stale_entries(self, current_time: float):
        cutoff = current_time - self.ttl_seconds
        expired_keys = [k for k, v in self.cache.items() if v.created_at < cutoff]
        for k in expired_keys:
            del self.cache[k]

    async def dispatch(self, request: Request, call_next) -> Response:
        # Check for Idempotency-Key header
        idempotency_key = request.headers.get("Idempotency-Key") or request.headers.get("X-Idempotency-Key")
        
        # Only process mutating methods with an Idempotency-Key
        if not idempotency_key or request.method not in ("POST", "PATCH", "PUT"):
            return await call_next(request)

        current_time = time.time()
        self._clean_stale_entries(current_time)

        # Check if response exists in cache
        if idempotency_key in self.cache:
            cached = self.cache[idempotency_key]
            response_headers = dict(cached.headers)
            response_headers["X-Cache-Hit"] = "true"
            response_headers["X-Idempotency-Key"] = idempotency_key
            return Response(
                content=cached.body,
                status_code=cached.status_code,
                headers=response_headers,
                media_type=cached.headers.get("content-type")
            )

        # Execute original request pipeline
        response = await call_next(request)

        # Read response body stream so it can be cached and re-emitted
        response_body = [section async for section in response.body_iterator]
        body_bytes = b"".join(response_body)

        # Store response data in idempotency cache if successful (2xx status codes)
        if 200 <= response.status_code < 300:
            headers_to_cache = {
                k: v for k, v in response.headers.items()
                if k.lower() not in ("content-length", "content-encoding", "transfer-encoding")
            }
            self.cache[idempotency_key] = CachedResponseData(
                status_code=response.status_code,
                headers=headers_to_cache,
                body=body_bytes,
                created_at=current_time
            )

        # Return reconstructed response
        response_headers = dict(response.headers)
        response_headers["X-Idempotency-Key"] = idempotency_key
        return Response(
            content=body_bytes,
            status_code=response.status_code,
            headers=response_headers,
            media_type=response.media_type
        )
