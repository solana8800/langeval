from fastapi import FastAPI
from contextlib import asynccontextmanager
from sqlmodel import SQLModel

from core.db import engine
# Import models to ensure they are registered with SQLModel.metadata
from models import models 
from api.v1.endpoints import auth, workspaces

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    SQLModel.metadata.create_all(engine)
    yield

app = FastAPI(
    title="Identity Service",
    description="Manages Authentication (Google OAuth) and Authorization (Workspaces)",
    version="1.0.0",
    lifespan=lifespan,
    root_path="/identity",
    servers=[
        {"url": "/identity", "description": "Production (Behind Nginx)"},
        {"url": "/", "description": "Local Development (Direct access)"}
    ]
)

from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8800", "http://localhost:8000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth.router, prefix="/api/v1", tags=["Authentication"])
app.include_router(workspaces.router, prefix="/api/v1", tags=["Workspaces"])

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "identity-service"}
