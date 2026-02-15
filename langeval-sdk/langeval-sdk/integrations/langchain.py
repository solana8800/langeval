from langfuse.callback import CallbackHandler
from ..core.context import get_campaign_id
from ..core.client import get_langfuse_client

def get_eval_callback() -> CallbackHandler:
    """
    Returns a configured LangfuseCallbackHandler.
    - Automatically injects Campaign ID tag.
    - Uses the shared Langfuse Client.
    """
    client = get_langfuse_client()
    campaign_id = get_campaign_id()
    
    tags = []
    metadata = {}
    
    if campaign_id:
        tags.append(f"campaign_id:{campaign_id}")
        metadata["campaign_id"] = campaign_id
        
    # Note: PII Masking for LangChain is harder to enforce at this level 
    # without subclassing. For MVP, we rely on Langfuse standard handling
    # but inject the context.
    
    return CallbackHandler(
        stateful_client=client,
        tags=tags,
        metadata=metadata
    )
