from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from sqlmodel import Session
from app.core.database import get_session
from app.services.trace_service import TraceService
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("")
async def get_traces(
    agent_id: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    cursor: Optional[str] = None,
    # Advanced filters
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    min_latency: Optional[float] = None,
    max_latency: Optional[float] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    tags: Optional[List[str]] = Query(None),
    session: Session = Depends(get_session)
):
    service = TraceService(session)
    
    # Validation filters for Langfuse
    filters = {}
    if search:
        filters["name"] = search
    if tags:
        filters["tags"] = tags
    if start_date:
        filters["fromTimestamp"] = start_date
    if end_date:
        filters["toTimestamp"] = end_date
        
    custom_filters = {
        "min_latency": min_latency,
        "max_latency": max_latency,
        "status": status
    }
    
    try:
        return await service.get_traces(
            agent_id=agent_id,
            limit=limit,
            offset=offset,
            cursor=cursor,
            filters=filters,
            custom_filters=custom_filters
        )
    except Exception as e:
        logger.error(f"Error fetching traces: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch traces from Langfuse: {str(e)}"
        )

@router.get("/{trace_id}")
async def get_trace_detail(
    trace_id: str, 
    agent_id: Optional[str] = None, 
    session: Session = Depends(get_session)
):
    service = TraceService(session)
    try:
        return await service.get_trace_detail(trace_id, agent_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
         logger.error(f"Error fetching trace detail: {str(e)}")
         raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch trace detail from Langfuse: {str(e)}"
        )
