from fastapi import APIRouter, Depends, HTTPException
from typing import List
import uuid
from sqlmodel import Session
from app.core.database import get_session
from app.api.deps import get_current_workspace
from app.models.domain import KnowledgeBaseRef, KnowledgeBaseUpdate, KnowledgeBaseCreate, Page
from app.services.kb_service import KBService

router = APIRouter()

@router.post("", response_model=KnowledgeBaseRef)
def create_kb(
    kb: KnowledgeBaseCreate, 
    session: Session = Depends(get_session),
    workspace_id: uuid.UUID = Depends(get_current_workspace)
):
    service = KBService(session, workspace_id)
    return service.create_kb(kb)

@router.get("", response_model=Page[KnowledgeBaseRef])
def read_kbs(
    page: int = 1, 
    page_size: int = 10, 
    session: Session = Depends(get_session),
    workspace_id: uuid.UUID = Depends(get_current_workspace)
):
    service = KBService(session, workspace_id)
    return service.get_kbs(page=page, page_size=page_size)

@router.put("/{id}", response_model=KnowledgeBaseRef)
def update_kb(
    id: str, 
    kb_update: KnowledgeBaseUpdate, 
    session: Session = Depends(get_session),
    workspace_id: uuid.UUID = Depends(get_current_workspace)
):
    service = KBService(session, workspace_id)
    try:
        updated_kb = service.update_kb(id, kb_update)
        if not updated_kb:
            raise HTTPException(status_code=404, detail="Knowledge Base not found")
        return updated_kb
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Update KB failed: {str(e)}")

@router.delete("/{id}")
def delete_kb(
    id: str, 
    session: Session = Depends(get_session),
    workspace_id: uuid.UUID = Depends(get_current_workspace)
):
    service = KBService(session, workspace_id)
    try:
        success = service.delete_kb(id)
        if not success:
             raise HTTPException(status_code=404, detail="Knowledge Base not found")
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Delete KB failed: {str(e)}")
