import time
from typing import Dict, List
from fastapi import Request, HTTPException, status
from fastapi.responses import Response


class SlidingWindowRateLimiter:
    """In-memory sliding window rate limiter for API endpoints."""

    def __init__(self, requests: int = 10, window_seconds: int = 60):
        self.requests = requests
        self.window_seconds = window_seconds
        # Maps client identifier -> list of request timestamps (float)
        self.client_timestamps: Dict[str, List[float]] = {}

    def _get_client_identifier(self, request: Request) -> str:
        # Prefer authenticated user ID from request state if available, else client host IP
        user = getattr(request.state, "user", None)
        if user and hasattr(user, "id"):
            return f"user:{user.id}"
        
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return f"ip:{forwarded.split(',')[0].strip()}"
        
        client_host = request.client.host if request.client else "unknown"
        return f"ip:{client_host}"

    def _clean_stale_requests(self, identifier: str, current_time: float):
        cutoff = current_time - self.window_seconds
        if identifier in self.client_timestamps:
            self.client_timestamps[identifier] = [
                ts for ts in self.client_timestamps[identifier] if ts > cutoff
            ]
            if not self.client_timestamps[identifier]:
                del self.client_timestamps[identifier]

    def check_rate_limit(self, request: Request, response: Response):
        current_time = time.time()
        identifier = self._get_client_identifier(request)
        
        self._clean_stale_requests(identifier, current_time)
        
        timestamps = self.client_timestamps.get(identifier, [])
        remaining = self.requests - len(timestamps)
        
        # Calculate reset time (seconds until earliest timestamp expires)
        reset_seconds = self.window_seconds
        if timestamps:
            oldest_ts = timestamps[0]
            reset_seconds = max(1, int(self.window_seconds - (current_time - oldest_ts)))
        
        # Attach standard rate limit headers to response
        response.headers["X-RateLimit-Limit"] = str(self.requests)
        response.headers["X-RateLimit-Remaining"] = str(max(0, remaining - 1))
        response.headers["X-RateLimit-Reset"] = str(reset_seconds)

        if len(timestamps) >= self.requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Maximum {self.requests} requests allowed per {self.window_seconds} seconds.",
                headers={
                    "X-RateLimit-Limit": str(self.requests),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(reset_seconds),
                    "Retry-After": str(reset_seconds)
                }
            )
        
        # Record current request timestamp
        if identifier not in self.client_timestamps:
            self.client_timestamps[identifier] = []
        self.client_timestamps[identifier].append(current_time)

    def __call__(self, request: Request, response: Response):
        self.check_rate_limit(request, response)
