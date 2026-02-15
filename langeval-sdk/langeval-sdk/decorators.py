import functools
import traceback
from .core.client import get_langfuse_client
from .core.context import get_campaign_id
from .core.security import mask_pii

def monitor(func):
    """
    Decorator to trace function execution with Langfuse.
    - Automatically captures Inputs/Outputs.
    - Masks PII.
    - Injects Campaign ID if available in context.
    """
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        langfuse = get_langfuse_client()
        campaign_id = get_campaign_id()
        
        # Start Trace
        trace = langfuse.trace(
            name=func.__name__,
            tags=[f"campaign_id:{campaign_id}"] if campaign_id else None,
            metadata={"campaign_id": campaign_id}
        )
        
        # Create Span
        span = trace.span(
            name=func.__name__,
            input=mask_pii(str(args) + str(kwargs))
        )
        
        try:
            result = func(*args, **kwargs)
            
            # Update Span on Success
            span.end(output=mask_pii(str(result)))
            return result
            
        except Exception as e:
            # Update Span on Failure
            span.end(
                level="ERROR",
                status_message=str(e),
                output=traceback.format_exc()
            )
            raise e
        finally:
            # Ensure Trace is logged (batching handled by client)
            pass
            
    return wrapper
