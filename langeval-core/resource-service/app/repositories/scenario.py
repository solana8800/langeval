from sqlmodel import Session
from app.models.domain import ScenarioRef, ScenarioUpdate
from app.repositories.base import BaseRepository
from datetime import datetime

class ScenarioRepository(BaseRepository[ScenarioRef, ScenarioUpdate]):
    def __init__(self, session: Session):
        super().__init__(ScenarioRef, session)

    def update(self, *, db_obj: ScenarioRef, obj_in: ScenarioUpdate) -> ScenarioRef:
        # Override to update updated_at automatically
        if obj_in.dict(exclude_unset=True):
           db_obj.updated_at = datetime.utcnow()
        return super().update(db_obj=db_obj, obj_in=obj_in)
