from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict
from sqlmodel import Session
from app.core.database import get_session
from app.models.domain import MetricConfigRef
from app.services.metric_service import MetricService

router = APIRouter()

@router.post("", response_model=MetricConfigRef)
def create_metric(metric: MetricConfigRef, session: Session = Depends(get_session)):
    service = MetricService(session)
    existing = service.get_metric(metric.id)
    if existing:
        raise HTTPException(status_code=400, detail="Metric ID already exists")
    return service.create_metric(metric)

@router.get("", response_model=List[MetricConfigRef])
def read_metrics(offset: int = 0, limit: int = 100, session: Session = Depends(get_session)):
    service = MetricService(session)
    return service.get_metrics(offset=offset, limit=limit)

@router.get("/{metric_id}", response_model=MetricConfigRef)
def read_metric(metric_id: str, session: Session = Depends(get_session)):
    service = MetricService(session)
    metric = service.get_metric(metric_id)
    if not metric:
        raise HTTPException(status_code=404, detail="Metric not found")
    return metric

@router.put("/{metric_id}", response_model=MetricConfigRef)
def update_metric(metric_id: str, update_data: Dict, session: Session = Depends(get_session)):
    service = MetricService(session)
    metric = service.update_metric(metric_id, update_data)
    if not metric:
        raise HTTPException(status_code=404, detail="Metric not found")
    return metric

@router.delete("/{metric_id}", response_model=MetricConfigRef)
def delete_metric(metric_id: str, session: Session = Depends(get_session)):
    service = MetricService(session)
    metric = service.delete_metric(metric_id)
    if not metric:
        raise HTTPException(status_code=404, detail="Metric not found")
    return metric

@router.post("/seed", response_model=List[MetricConfigRef])
def seed_default_metrics(metrics_list: List[Dict], session: Session = Depends(get_session)):
    service = MetricService(session)
    return service.seed_default_metrics(metrics_list)
