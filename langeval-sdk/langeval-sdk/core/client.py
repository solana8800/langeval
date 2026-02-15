import os
from langfuse import Langfuse
from typing import Optional

_langfuse_client: Optional[Langfuse] = None

def get_langfuse_client() -> Langfuse:
    global _langfuse_client
    if _langfuse_client is None:
        # Langfuse automatically reads env vars:
        # LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY, LANGFUSE_HOST
        _langfuse_client = Langfuse()
    return _langfuse_client
