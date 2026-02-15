from sqlmodel import Session
from app.models.domain import AgentRef, AgentUpdate
from app.repositories.base import BaseRepository

class AgentRepository(BaseRepository[AgentRef, AgentUpdate]):
    def __init__(self, session: Session):
        super().__init__(AgentRef, session)
