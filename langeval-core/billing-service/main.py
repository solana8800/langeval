from fastapi import FastAPI
from contextlib import asynccontextmanager
from sqlmodel import SQLModel
from fastapi.middleware.cors import CORSMiddleware

from core.db import engine
from models import models
from api.v1.endpoints import billing

@asynccontextmanager
async def lifespan(app: FastAPI):
    SQLModel.metadata.create_all(engine)
    
    # Data Seeding for basic Plans
    from sqlmodel import Session, select
    with Session(engine) as session:
        if not session.exec(select(models.Plan)).first():
            free_plan = models.Plan(
                name="Free",
                price_monthly=0,
                price_annual=0,
                features={"max_workspaces": 3, "max_scenarios": 9, "max_runs_per_month": 99, "red_teaming": False}
            )
            pro_plan = models.Plan(
                name="Pro",
                price_monthly=9.0,
                price_annual=90.0,
                features={"max_workspaces": 9, "max_scenarios": 99, "max_runs_per_month": 10000, "red_teaming": True}
            )
            enterprise_plan = models.Plan(
                name="Enterprise",
                price_monthly=50.0,
                price_annual=500.0,
                features={"max_workspaces": -1, "max_scenarios": -1, "max_runs_per_month": -1, "red_teaming": True}
            )
            session.add_all([free_plan, pro_plan, enterprise_plan])
            session.commit()
    
    yield

app = FastAPI(
    title="Billing Service",
    description="Manages Subscriptions and Payments (PayPal) for Langeval SaaS",
    version="1.0.0",
    lifespan=lifespan,
    root_path="/billing"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(billing.router, prefix="/api/v1/billing", tags=["Billing"])

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "billing-service"}
