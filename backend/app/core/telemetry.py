import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any
from app.core.event_bus import event_bus

logger = logging.getLogger("telemetry")
logging.basicConfig(level=logging.INFO)

DOMAIN_EVENTS = [
    "job_created",
    "offer_accepted",
    "referral_requested",
    "ai_match_executed",
    "company_created",
]


def _log_event(event_name: str, payload: Dict[str, Any]):
    entry = json.dumps({
        "event": event_name,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "payload": payload,
    })
    print(f"TELEMETRY: {entry}")
    logger.info(entry)


def setup_telemetry_listeners():
    for evt in DOMAIN_EVENTS:
        def make_handler(name=evt):
            async def handler(payload: Dict[str, Any]):
                _log_event(name, payload)
            return handler
        event_bus.subscribe(evt, make_handler())
