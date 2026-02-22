from contextvars import ContextVar
from typing import Optional

# Global ContextVar to store Campaign ID (Thread-safe & Async-safe)
_campaign_id_ctx = ContextVar("campaign_id", default=None)

def set_campaign_id(campaign_id: str):
    _campaign_id_ctx.set(campaign_id)

def get_campaign_id() -> Optional[str]:
    return _campaign_id_ctx.get()
