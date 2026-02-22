from fastapi import APIRouter, Depends, HTTPException
from typing import List
import uuid
from sqlmodel import Session
from app.core.database import get_session
from app.models.domain import ScenarioRef, ScenarioUpdate, ScenarioCreate, Page
from app.services.scenario_service import ScenarioService
from app.api.deps import get_current_workspace

router = APIRouter()

@router.post("", response_model=ScenarioRef)
def create_scenario(
    scenario_in: ScenarioCreate, 
    session: Session = Depends(get_session),
    workspace_id: uuid.UUID = Depends(get_current_workspace)
):
    service = ScenarioService(session, workspace_id)
    try:
        return service.create_scenario(scenario_in)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Create Scenario failed: {str(e)}")

@router.get("", response_model=Page[ScenarioRef])
def read_scenarios(
    page: int = 1, 
    page_size: int = 10, 
    agent_id: str = None, 
    search: str = None, 
    session: Session = Depends(get_session),
    workspace_id: uuid.UUID = Depends(get_current_workspace)
):
    service = ScenarioService(session, workspace_id)
    return service.get_scenarios(page=page, page_size=page_size, agent_id=agent_id, search=search)

@router.get("/{id}", response_model=ScenarioRef)
def read_scenario(
    id: str, 
    session: Session = Depends(get_session),
    workspace_id: uuid.UUID = Depends(get_current_workspace)
):
    service = ScenarioService(session, workspace_id)
    scenario = service.get_scenario(id)
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return scenario

@router.put("/{id}", response_model=ScenarioRef)
def update_scenario(
    id: str, 
    scenario_update: ScenarioUpdate, 
    session: Session = Depends(get_session),
    workspace_id: uuid.UUID = Depends(get_current_workspace)
):
    service = ScenarioService(session, workspace_id)
    try:
        updated_scenario = service.update_scenario(id, scenario_update)
        if not updated_scenario:
            raise HTTPException(status_code=404, detail="Scenario not found")
        return updated_scenario
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Update failed: {str(e)}")

@router.delete("/{id}")
def delete_scenario(
    id: str, 
    session: Session = Depends(get_session),
    workspace_id: uuid.UUID = Depends(get_current_workspace)
):
    service = ScenarioService(session, workspace_id)
    success = service.delete_scenario(id)
    if not success:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return {"ok": True}

from app.services.ai_service import ai_service
from app.models.domain import AIScenarioRequest

@router.post("/generate-ai")
async def generate_ai(request: AIScenarioRequest):
    print(f"--- AI GENERATION REQUEST: {request.prompt[:50]}... ---")
    try:
        result = await ai_service.generate_scenario(
            prompt=request.prompt,
            current_nodes=request.current_nodes,
            current_edges=request.current_edges,
            model_id=request.model_id,
            agent_id=request.agent_id
        )
        print("--- AI GENERATION SUCCESS ---")
        return result
    except Exception as e:
        print(f"--- AI GENERATION FAILED: {str(e)} ---")
        raise HTTPException(status_code=500, detail=f"AI Generation failed: {str(e)}")
