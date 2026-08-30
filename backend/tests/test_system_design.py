import time
import pytest
from unittest.mock import MagicMock
from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.testclient import TestClient

from app.core.rate_limiter import SlidingWindowRateLimiter
from app.core.idempotency import IdempotencyMiddleware
from app.core.circuit_breaker import CircuitBreaker, CircuitState
from app.core.event_bus import EventBus


def test_rate_limiter_allows_and_blocks():
    limiter = SlidingWindowRateLimiter(requests=3, window_seconds=60)
    mock_request = MagicMock(spec=Request)
    mock_request.state = MagicMock()
    mock_request.state.user = None
    mock_request.headers = {}
    mock_request.client.host = "127.0.0.1"
    mock_response = Response()

    limiter.check_rate_limit(mock_request, mock_response)
    limiter.check_rate_limit(mock_request, mock_response)
    limiter.check_rate_limit(mock_request, mock_response)

    assert mock_response.headers.get("X-RateLimit-Limit") == "3"
    assert mock_response.headers.get("X-RateLimit-Remaining") == "0"

    with pytest.raises(HTTPException) as exc_info:
        limiter.check_rate_limit(mock_request, mock_response)
    assert exc_info.value.status_code == 429


def test_idempotency_middleware_caching():
    test_app = FastAPI()
    test_app.add_middleware(IdempotencyMiddleware, ttl_seconds=60)
    call_count = {"count": 0}

    @test_app.post("/test-idempotent")
    def sample_endpoint():
        call_count["count"] += 1
        return {"result": f"Execution #{call_count['count']}"}

    client = TestClient(test_app)
    headers = {"Idempotency-Key": "test-key-12345"}

    res1 = client.post("/test-idempotent", headers=headers)
    assert res1.status_code == 200
    assert res1.json()["result"] == "Execution #1"
    assert "X-Cache-Hit" not in res1.headers

    res2 = client.post("/test-idempotent", headers=headers)
    assert res2.status_code == 200
    assert res2.json()["result"] == "Execution #1"
    assert res2.headers.get("X-Cache-Hit") == "true"
    assert call_count["count"] == 1


def test_circuit_breaker_transitions():
    cb = CircuitBreaker(failure_threshold=2, recovery_timeout=0.2)
    assert cb.state == CircuitState.CLOSED

    def failing_func():
        raise ValueError("Simulated outage")

    def fallback_func():
        return "fallback_result"

    res1 = cb.call(failing_func, fallback_func)
    assert res1 == "fallback_result"
    assert cb.state == CircuitState.CLOSED

    res2 = cb.call(failing_func, fallback_func)
    assert res2 == "fallback_result"
    assert cb.state == CircuitState.OPEN

    primary_called = {"called": False}

    def primary_func():
        primary_called["called"] = True
        return "primary_success"

    res3 = cb.call(primary_func, fallback_func)
    assert res3 == "fallback_result"
    assert not primary_called["called"]

    time.sleep(0.25)
    res4 = cb.call(primary_func, fallback_func)
    assert res4 == "primary_success"
    assert cb.state == CircuitState.CLOSED


@pytest.mark.anyio
async def test_event_bus_and_telemetry():
    local_bus = EventBus()
    received_payloads = []

    async def custom_handler(payload):
        received_payloads.append(payload)

    local_bus.subscribe("job_created", custom_handler)
    await local_bus.publish("job_created", {"job_id": "job-99", "title": "Lead Architect"})

    assert len(received_payloads) == 1
    assert received_payloads[0]["title"] == "Lead Architect"
