from flask import request, Flask
from ..core.context import set_campaign_id

def register_eval_context(app: Flask):
    """
    Registers a before_request hook to extract X-Eval-Campaign-ID header.
    
    Usage:
        app = Flask(__name__)
        register_eval_context(app)
    """
    @app.before_request
    def capture_campaign_id():
        campaign_id = request.headers.get("X-Eval-Campaign-ID")
        if campaign_id:
            set_campaign_id(campaign_id)
