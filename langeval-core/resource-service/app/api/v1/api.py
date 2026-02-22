from fastapi import APIRouter
from app.api.v1.endpoints import agents, knowledge_bases, scenarios, models_llm, metrics, traces, reviews, dashboard, red_teaming, battle, benchmarks

api_router = APIRouter()
api_router.include_router(agents.router, prefix="/agents", tags=["Agents"])
api_router.include_router(knowledge_bases.router, prefix="/knowledge-bases", tags=["Knowledge Bases"])
api_router.include_router(scenarios.router, prefix="/scenarios", tags=["Scenarios"])
api_router.include_router(models_llm.router, prefix="/models", tags=["Models"])
api_router.include_router(metrics.router, prefix="/metrics-library", tags=["Metrics"])
api_router.include_router(traces.router, prefix="/traces", tags=["Traces"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["Manual Reviews"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(red_teaming.router, prefix="/red-teaming", tags=["Red Teaming"])
api_router.include_router(battle.router, prefix="/battle", tags=["Battle Arena"])
api_router.include_router(benchmarks.router, prefix="/benchmarks", tags=["Benchmarks"])
