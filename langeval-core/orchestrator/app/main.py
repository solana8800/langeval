from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.api.routes import campaigns, battle, benchmarks
from app.core.resources import init_resources, close_resources

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_resources()
    yield
    await close_resources()

app = FastAPI(title="orchestrator", lifespan=lifespan)

app.include_router(campaigns.router)
app.include_router(battle.router)
app.include_router(benchmarks.router, prefix="/api/v1/benchmarks", tags=["benchmarks"])
