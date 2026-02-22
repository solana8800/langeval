from typing import List, Optional, Union
import uuid
from math import ceil
from sqlmodel import Session, func, select
from app.repositories.kb import KBRepository
from app.models.domain import KnowledgeBaseRef, KnowledgeBaseUpdate, KnowledgeBaseCreate, Page

class KBService:
    def __init__(self, session: Session, workspace_id: uuid.UUID):
        self.repository = KBRepository(session)
        self.session = session
        self.workspace_id = workspace_id

    def create_kb(self, kb_in: KnowledgeBaseCreate) -> KnowledgeBaseRef:
        kb = KnowledgeBaseRef(
            **kb_in.dict(),
            workspace_id=self.workspace_id
        )
        return self.repository.create(kb)

    def get_kb(self, kb_id: str) -> Optional[KnowledgeBaseRef]:
        kb = self.repository.get(kb_id)
        if kb and kb.workspace_id == self.workspace_id:
            return kb
        return None

    def get_kbs(self, page: int = 1, page_size: int = 10) -> Page[KnowledgeBaseRef]:
        offset = (page - 1) * page_size
        
        # Filter items by workspace
        statement = select(KnowledgeBaseRef)\
            .where(KnowledgeBaseRef.workspace_id == self.workspace_id)\
            .offset(offset).limit(page_size)
        items = self.session.exec(statement).all()
        
        # Count total for workspace
        count_stmt = select(func.count())\
            .select_from(KnowledgeBaseRef)\
            .where(KnowledgeBaseRef.workspace_id == self.workspace_id)
        total = self.session.exec(count_stmt).one()
        
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
        db_kb = self.get_kb(kb_id)
        if not db_kb:
             return False
        self.repository.remove(id=kb_id)
        return True
