import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any
from app.core.event_bus import event_bus

logger = logging.getLogger("telemetry")
logging.basicConfig(level=logging.INFO)


def _log_structured_event(event_name: str, payload: Dict[str, Any]):
    log_entry = {
        "telemetry_event": event_name,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "payload": payload
    }
    json_output = json.dumps(log_entry)
    print(f"TELEMETRY: {json_output}")
    logger.info(json_output)


async def telemetry_event_handler(event_name: str, payload: Dict[str, Any]):
    _log_structured_event(event_name, payload)


def setup_telemetry_listeners():
    """Register telemetry logging handlers for all key domain events."""
    domain_events = [
        "job_created",
        "offer_accepted",
        "referral_requested",
        "ai_match_executed",
        "company_created"
    ]
    for evt in domain_events:
        # Create a closure bound to the current event name
        def make_handler(name=evt):
            async def handler(payload: Dict[str, Any]):
                await telemetry_event_handler(name, payload)
            return handler

        event_bus.subscribe(evt, make_handler())
