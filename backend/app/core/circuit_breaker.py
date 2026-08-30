import time
import enum
from typing import Callable, Any, Optional


class CircuitState(str, enum.Enum):
    CLOSED = "CLOSED"
    OPEN = "OPEN"
    HALF_OPEN = "HALF_OPEN"


class CircuitBreaker:
    """Circuit Breaker pattern implementation for isolating external service failures."""

    def __init__(self, failure_threshold: int = 3, recovery_timeout: float = 30.0):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.last_state_change = time.time()

    def _update_state_if_needed(self):
        current_time = time.time()
        if self.state == CircuitState.OPEN and (current_time - self.last_state_change >= self.recovery_timeout):
            self.state = CircuitState.HALF_OPEN
            self.last_state_change = current_time

    def call(self, func: Callable, fallback_func: Callable, *args, **kwargs) -> Any:
        """Execute synchronous function wrapped in circuit breaker safety."""
        self._update_state_if_needed()

        if self.state == CircuitState.OPEN:
            print(f"CircuitBreaker [{self.state.value}]: Short-circuiting call to fallback.")
            return fallback_func(*args, **kwargs)

        try:
            result = func(*args, **kwargs)
            # Success in HALF_OPEN recovers circuit to CLOSED
            if self.state == CircuitState.HALF_OPEN:
                self.state = CircuitState.CLOSED
                self.failure_count = 0
                self.last_state_change = time.time()
            return result
        except Exception as err:
            self.failure_count += 1
            print(f"CircuitBreaker Exception ({self.failure_count}/{self.failure_threshold}): {err}")
            if self.failure_count >= self.failure_threshold:
                self.state = CircuitState.OPEN
                self.last_state_change = time.time()
                print(f"CircuitBreaker state changed to OPEN for {self.recovery_timeout}s")
            return fallback_func(*args, **kwargs)

    async def async_call(self, async_func: Callable, fallback_func: Callable, *args, **kwargs) -> Any:
        """Execute asynchronous function wrapped in circuit breaker safety."""
        self._update_state_if_needed()

        if self.state == CircuitState.OPEN:
            print(f"CircuitBreaker [{self.state.value}]: Short-circuiting async call to fallback.")
            return fallback_func(*args, **kwargs)

        try:
            result = await async_func(*args, **kwargs)
            if self.state == CircuitState.HALF_OPEN:
                self.state = CircuitState.CLOSED
                self.failure_count = 0
                self.last_state_change = time.time()
            return result
        except Exception as err:
            self.failure_count += 1
            print(f"CircuitBreaker Async Exception ({self.failure_count}/{self.failure_threshold}): {err}")
            if self.failure_count >= self.failure_threshold:
                self.state = CircuitState.OPEN
                self.last_state_change = time.time()
            return fallback_func(*args, **kwargs)
