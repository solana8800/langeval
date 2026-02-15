from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from ..core.context import set_campaign_id

class EvalContextMiddleware(BaseHTTPMiddleware):
    """
    Middleware to automatically extract X-Eval-Campaign-ID header
    and set it in the context for easier tracing.
    """
    async def dispatch(self, request: Request, call_next):
        campaign_id = request.headers.get("X-Eval-Campaign-ID")
        if campaign_id:
            set_campaign_id(campaign_id)
            
        response = await call_next(request)
        return response
