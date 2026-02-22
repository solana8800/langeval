from fastapi import FastAPI
import asyncio
from app.consumers.kafka_consumer import consume_messages
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    root_path="/evaluation",
    servers=[
        {"url": "/evaluation", "description": "Production (Behind Nginx)"},
        {"url": "/", "description": "Local Development"}
    ]
)

@app.on_event("startup")
async def startup_event():
    # Start Kafka Consumer in Background
    asyncio.create_task(consume_messages())

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "evaluation-worker"}
