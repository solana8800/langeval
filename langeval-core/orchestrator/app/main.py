from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.api.routes import campaigns, battle, benchmarks
from app.core.resources import init_resources, close_resources

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_resources()
    yield
    await close_resources()

app = FastAPI(
    title="orchestrator", 
    lifespan=lifespan,
    root_path="/orchestrator",
    servers=[
        {"url": "/orchestrator", "description": "Production (Behind Nginx)"},
        {"url": "/", "description": "Local Development (Direct access)"}
    ]
)

app.include_router(campaigns.router, prefix="/api/v1/orchestrator", tags=["campaigns"])
app.include_router(battle.router, prefix="/api/v1/orchestrator", tags=["battle"])
app.include_router(benchmarks.router, prefix="/api/v1/orchestrator/benchmarks", tags=["benchmarks"])
