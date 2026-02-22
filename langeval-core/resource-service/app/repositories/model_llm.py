from sqlmodel import Session
from app.models.domain import ModelRef, ModelUpdate
from app.repositories.base import BaseRepository

class ModelRepository(BaseRepository[ModelRef, ModelUpdate]):
    def __init__(self, session: Session):
        super().__init__(ModelRef, session)
