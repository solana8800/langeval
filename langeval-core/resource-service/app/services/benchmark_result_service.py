from typing import List, Optional
from sqlmodel import Session, select, func
from app.models.domain import BenchmarkResult, BenchmarkResultCreate
import uuid
from math import ceil

class BenchmarkResultService:
    def __init__(self, db: Session):
        self.db = db

    def create(self, obj_in: BenchmarkResultCreate) -> BenchmarkResult:
        db_obj = BenchmarkResult(
            id=str(uuid.uuid4()),
            **obj_in.dict()
        )
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def get(self, id: str) -> Optional[BenchmarkResult]:
        return self.db.get(BenchmarkResult, id)

    def get_multi(self, skip: int = 0, limit: int = 20) -> List[BenchmarkResult]:
        statement = select(BenchmarkResult).order_by(BenchmarkResult.created_at.desc()).offset(skip).limit(limit)
        return self.db.exec(statement).all()

    def count(self) -> int:
        return self.db.exec(select(func.count(BenchmarkResult.id))).one()
