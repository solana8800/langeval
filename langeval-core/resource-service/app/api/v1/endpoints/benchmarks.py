from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session
from app.core.database import get_session
from app.models.domain import BenchmarkResult, BenchmarkResultCreate, Page
from app.services.benchmark_result_service import BenchmarkResultService
from math import ceil

router = APIRouter()

@router.post("", response_model=BenchmarkResult)
def create_benchmark_result(
    *,
    db: Session = Depends(get_session),
    result_in: BenchmarkResultCreate
) -> BenchmarkResult:
    """
    Create a new Benchmark Result.
    """
    service = BenchmarkResultService(db)
    return service.create(result_in)

@router.get("", response_model=Page[BenchmarkResult])
def list_benchmark_results(
    *,
    db: Session = Depends(get_session),
    page: int = 1,
    size: int = 20
) -> Page[BenchmarkResult]:
    """
    List Benchmark Results with pagination.
    """
    service = BenchmarkResultService(db)
    skip = (page - 1) * size
    total = service.count()
    items = service.get_multi(skip=skip, limit=size)

    return Page(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=ceil(total / size) if size > 0 else 0
    )

@router.get("/{id}", response_model=BenchmarkResult)
def get_benchmark_result(
    *,
    db: Session = Depends(get_session),
    id: str
) -> BenchmarkResult:
    """
    Get a specific Benchmark Result by ID.
    """
    service = BenchmarkResultService(db)
    result = service.get(id)
    if not result:
        raise HTTPException(status_code=404, detail="Benchmark Result not found")
    return result
