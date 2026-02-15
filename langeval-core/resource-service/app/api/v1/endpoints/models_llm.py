from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlmodel import Session
from app.core.database import get_session
from app.models.domain import ModelRef, ModelUpdate, ModelCreate, Page
from app.services.model_service import ModelService

router = APIRouter()

@router.post("", response_model=ModelRef)
def create_model(model: ModelCreate, session: Session = Depends(get_session)):
    service = ModelService(session)
    return service.create_model(model)

@router.get("", response_model=Page[ModelRef])
def read_models(page: int = 1, page_size: int = 10, session: Session = Depends(get_session)):
    service = ModelService(session)
    return service.get_models(page=page, page_size=page_size)

@router.get("/{id}", response_model=ModelRef)
def read_model(id: str, session: Session = Depends(get_session)):
    service = ModelService(session)
    model = service.get_model(id)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    return model

@router.put("/{id}", response_model=ModelRef)
def update_model(id: str, model_update: ModelUpdate, session: Session = Depends(get_session)):
    service = ModelService(session)
    try:
        updated_model = service.update_model(id, model_update)
        if not updated_model:
            raise HTTPException(status_code=404, detail="Model not found")
        return updated_model
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Update Model failed: {str(e)}")

@router.delete("/{id}")
def delete_model(id: str, session: Session = Depends(get_session)):
    service = ModelService(session)
    success = service.delete_model(id)
    if not success:
        raise HTTPException(status_code=404, detail="Model not found")
    return {"ok": True}
