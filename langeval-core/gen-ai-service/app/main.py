from fastapi import FastAPI
from app.api.routes import gen_ai

app = FastAPI(
    title="gen-ai-service",
    root_path="/gen-ai",
    servers=[
        {"url": "/gen-ai", "description": "Production (Behind Nginx)"},
        {"url": "/", "description": "Local Development (Direct access)"}
    ]
)

app.include_router(gen_ai.router, prefix="/api/v1/gen-ai", tags=["gen-ai"])
