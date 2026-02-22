from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import create_db_and_tables
from app.api.v1.api import api_router
from app.core.database import engine, SQLModel

app = FastAPI(
    title="resource-service",
    root_path="/resource",
    servers=[
        {"url": "/resource", "description": "Production (Behind Nginx)"},
        {"url": "/", "description": "Local Development (Direct access)"}
    ]
)

# Function to reset DB - kept for compatibility/demo
# In a real app, this might be in a separate script or admin endpoint
from fastapi import APIRouter, Depends
from sqlmodel import Session
from app.core.database import get_session
from app.core.config import settings

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root router for health and reset
root_router = APIRouter()

@root_router.get("/health")
def health_check():
    return {"status": "ok", "service": "resource-service"}

@root_router.post("/api/v1/resource/reset-db")
def reset_database(session: Session = Depends(get_session)):
    # Drop all tables and recreate to ensure schema is fresh
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)
    return {"status": "cleared_and_recreated"}

app.include_router(root_router)
app.include_router(api_router, prefix="/api/v1/resource")
