import time
import enum
from typing import Callable, Any


class CircuitState(str, enum.Enum):
    CLOSED = "CLOSED"
    OPEN = "OPEN"
    HALF_OPEN = "HALF_OPEN"


class CircuitBreaker:

    def __init__(self, failure_threshold: int = 3, recovery_timeout: float = 30.0):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.last_state_change = time.time()

    def _update_state_if_needed(self):
        if self.state == CircuitState.OPEN and (time.time() - self.last_state_change >= self.recovery_timeout):
            self.state = CircuitState.HALF_OPEN
            self.last_state_change = time.time()

    def _on_success(self):
        if self.state == CircuitState.HALF_OPEN:
            self.state = CircuitState.CLOSED
            self.failure_count = 0
            self.last_state_change = time.time()

    def _on_failure(self, err: Exception):
        self.failure_count += 1
        print(f"CircuitBreaker failure ({self.failure_count}/{self.failure_threshold}): {err}")
        if self.failure_count >= self.failure_threshold:
            self.state = CircuitState.OPEN
            self.last_state_change = time.time()
            print(f"CircuitBreaker opened for {self.recovery_timeout}s")

    def call(self, func: Callable, fallback_func: Callable, *args, **kwargs) -> Any:
        self._update_state_if_needed()
        if self.state == CircuitState.OPEN:
            return fallback_func(*args, **kwargs)
        try:
            result = func(*args, **kwargs)
            self._on_success()
            return result
        except Exception as err:
            self._on_failure(err)
            return fallback_func(*args, **kwargs)

    async def async_call(self, async_func: Callable, fallback_func: Callable, *args, **kwargs) -> Any:
        self._update_state_if_needed()
        if self.state == CircuitState.OPEN:
            return fallback_func(*args, **kwargs)
        try:
            result = await async_func(*args, **kwargs)
            self._on_success()
            return result
        except Exception as err:
            self._on_failure(err)
            return fallback_func(*args, **kwargs)
