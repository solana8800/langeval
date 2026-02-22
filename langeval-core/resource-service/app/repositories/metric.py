from typing import Any
from sqlmodel import Session
from app.models.domain import MetricConfigRef
from app.repositories.base import BaseRepository

# MetricConfigRef doesn't have a specific Update model in original file, reusing create model or dict
class MetricRepository(BaseRepository[MetricConfigRef, Any]):
    def __init__(self, session: Session):
        super().__init__(MetricConfigRef, session)
