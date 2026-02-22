from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List
import uuid
from sqlmodel import Session
from app.core.database import get_session
from app.api.deps import get_current_workspace
from app.models.domain import AgentRef, AgentUpdate, AgentCreate, Page
from app.services.agent_service import AgentService

router = APIRouter()

@router.post("", response_model=AgentRef)
def create_agent(
    agent: AgentCreate, 
    session: Session = Depends(get_session),
    workspace_id: uuid.UUID = Depends(get_current_workspace)
):
    service = AgentService(session, workspace_id)
    try:
        return service.create_agent(agent)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Create Agent failed: {str(e)}")

@router.get("", response_model=Page[AgentRef])
def read_agents(
    page: int = 1, 
    page_size: int = 10, 
    session: Session = Depends(get_session),
    workspace_id: uuid.UUID = Depends(get_current_workspace)
):
    service = AgentService(session, workspace_id)
    return service.get_agents(page=page, page_size=page_size)

@router.get("/{id}", response_model=AgentRef)
def read_agent(
    id: str, 
    session: Session = Depends(get_session),
    workspace_id: uuid.UUID = Depends(get_current_workspace)
):
    service = AgentService(session, workspace_id)
    agent = service.get_agent(id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent

@router.put("/{id}", response_model=AgentRef)
def update_agent(
    id: str, 
    agent_update: AgentUpdate, 
    session: Session = Depends(get_session),
    workspace_id: uuid.UUID = Depends(get_current_workspace)
):
    service = AgentService(session, workspace_id)
    try:
        updated_agent = service.update_agent(id, agent_update)
        if not updated_agent:
            raise HTTPException(status_code=404, detail="Agent not found")
        return updated_agent
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Update Agent failed: {str(e)}")

@router.delete("/{id}")
def delete_agent(
    id: str, 
    session: Session = Depends(get_session),
    workspace_id: uuid.UUID = Depends(get_current_workspace)
):
    service = AgentService(session, workspace_id)
    try:
        success = service.delete_agent(id)
        if not success:
            raise HTTPException(status_code=404, detail="Agent not found")
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Delete Agent failed: {str(e)}")
