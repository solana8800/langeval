from fastapi import FastAPI
from app.api.routes import gen_ai

app = FastAPI(title="gen-ai-service")

app.include_router(gen_ai.router)
