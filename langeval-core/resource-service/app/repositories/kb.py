from sqlmodel import Session
from app.models.domain import KnowledgeBaseRef, KnowledgeBaseUpdate
from app.repositories.base import BaseRepository

class KBRepository(BaseRepository[KnowledgeBaseRef, KnowledgeBaseUpdate]):
    def __init__(self, session: Session):
        super().__init__(KnowledgeBaseRef, session)
