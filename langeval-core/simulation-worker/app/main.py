from fastapi import FastAPI
import asyncio
from app.worker import consume_messages
from app.core.resources import init_resources, close_resources

app = FastAPI(
    title="simulation-worker",
    root_path="/simulation",
    servers=[
        {"url": "/simulation", "description": "Production (Behind Nginx)"},
        {"url": "/", "description": "Local Development"}
    ]
)

@app.on_event("startup")
async def startup_event():
    # Initialize Shared Resources (Producer, Redis)
    await init_resources()
    
    # Start Kafka Consumer in Background
    asyncio.create_task(consume_messages())

@app.on_event("shutdown")
async def shutdown_event():
    await close_resources()

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "simulation-worker"}
