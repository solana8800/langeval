from typing import List, Optional, Union
import uuid
from math import ceil
from sqlmodel import Session, func, select
from app.repositories.kb import KBRepository
from app.models.domain import KnowledgeBaseRef, KnowledgeBaseUpdate, Page

class KBService:
    def __init__(self, session: Session):
        self.repository = KBRepository(session)
        self.session = session

    def create_kb(self, kb: KnowledgeBaseRef) -> KnowledgeBaseRef:
        return self.repository.create(kb)

    def get_kb(self, kb_id: str) -> Optional[KnowledgeBaseRef]:
        return self.repository.get(kb_id)

    def get_kbs(self, page: int = 1, page_size: int = 10) -> Page[KnowledgeBaseRef]:
        offset = (page - 1) * page_size
        items = self.repository.get_multi(skip=offset, limit=page_size)
        statement = select(func.count()).select_from(KnowledgeBaseRef)
        total = self.session.exec(statement).one()
        pages = ceil(total / page_size) if page_size > 0 else 0
        
        return Page(
            items=items,
            total=total,
            page=page,
            size=page_size,
            pages=pages
        )

    def update_kb(self, kb_id: str, kb_update: KnowledgeBaseUpdate) -> Optional[KnowledgeBaseRef]:
        db_kb = self.get_kb(kb_id)
        if not db_kb:
            return None
        return self.repository.update(db_obj=db_kb, obj_in=kb_update)

    def delete_kb(self, kb_id: str) -> bool:
        db_kb = self.repository.get(kb_id)
        if not db_kb:
             return False
        self.repository.remove(id=kb_id)
        return True
