import os
from langfuse import Langfuse
from typing import Optional

_langfuse_client: Optional[Langfuse] = None

def get_langfuse_client() -> Langfuse:
    global _langfuse_client
    if _langfuse_client is None:
        _langfuse_client = Langfuse()
    return _langfuse_client
