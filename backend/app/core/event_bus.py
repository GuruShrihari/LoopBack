import asyncio
import inspect
from typing import Dict, List, Callable, Any


class EventBus:

    def __init__(self):
        self._subscribers: Dict[str, List[Callable[[Dict[str, Any]], Any]]] = {}

    def subscribe(self, event_name: str, handler: Callable[[Dict[str, Any]], Any]):
        if event_name not in self._subscribers:
            self._subscribers[event_name] = []
        if handler not in self._subscribers[event_name]:
            self._subscribers[event_name].append(handler)

    async def publish(self, event_name: str, payload: Dict[str, Any]):
        for handler in self._subscribers.get(event_name, []):
            try:
                if inspect.iscoroutinefunction(handler):
                    await handler(payload)
                else:
                    handler(payload)
            except Exception as err:
                print(f"EventBus handler error [{event_name}]: {err}")


event_bus = EventBus()
