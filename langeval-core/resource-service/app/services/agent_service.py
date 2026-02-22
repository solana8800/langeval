from typing import List, Optional
from math import ceil
import uuid
from sqlmodel import Session, func, select
from app.models.domain import AgentRef, AgentUpdate, AgentCreate, Page
from app.repositories.agent import AgentRepository
from app.core.security import encrypt_value
from app.core.cache import cached, cache_service

class AgentService:
    def __init__(self, session: Session, workspace_id: uuid.UUID = None):
        self.repository = AgentRepository(session)
        self.session = session
        self.workspace_id = workspace_id

    def create_agent(self, agent_in: AgentCreate) -> AgentRef:
        # Encrypt API Key
        data = agent_in.dict(exclude={"api_key", "langfuse_secret_key"})
        enc_key = encrypt_value(agent_in.api_key) if agent_in.api_key else None
        
        # Encrypt Langfuse Secret Key
        enc_lf_sk = encrypt_value(agent_in.langfuse_secret_key) if agent_in.langfuse_secret_key else None
        
        # Add Workspace ID if available
        if self.workspace_id:
            data["workspace_id"] = self.workspace_id

        agent_db = AgentRef(**data, api_key_encrypted=enc_key, langfuse_secret_key_encrypted=enc_lf_sk)
        return self.repository.create(agent_db)

    @cached(key_prefix="agent", ttl=60)  # Cache 1 phút
    def get_agent(self, agent_id: str) -> Optional[AgentRef]:
        return self.repository.get(agent_id)

    @cached(key_prefix="agents_list", ttl=60)  # Cache 1 phút
    def get_agents(self, page: int = 1, page_size: int = 10) -> Page[AgentRef]:
        offset = (page - 1) * page_size
        
        # Build query with optional workspace filter
        query = select(AgentRef)
        count_query = select(func.count()).select_from(AgentRef)
        
        if self.workspace_id:
            query = query.where(AgentRef.workspace_id == self.workspace_id)
            count_query = count_query.where(AgentRef.workspace_id == self.workspace_id)
            
        items = self.session.exec(query.offset(offset).limit(page_size)).all()
        total = self.session.exec(count_query).one()
        pages = ceil(total / page_size) if page_size > 0 else 0
        
        return Page(
            items=items,
            total=total,
            page=page,
            size=page_size,
            pages=pages
        )

    def update_agent(self, agent_id: str, agent_update: AgentUpdate) -> Optional[AgentRef]:
        db_agent = self.repository.get(agent_id)
        if not db_agent:
            return None
            
        update_data = agent_update.dict(exclude_unset=True)
        
        # Handle API Key Rotation
        if "api_key" in update_data:
             raw_key = update_data.pop("api_key")
             if raw_key:
                 update_data["api_key_encrypted"] = encrypt_value(raw_key)

        # Handle Langfuse Secret Key Rotation
        if "langfuse_secret_key" in update_data:
             raw_lf_sk = update_data.pop("langfuse_secret_key")
             if raw_lf_sk:
                 update_data["langfuse_secret_key_encrypted"] = encrypt_value(raw_lf_sk)
        
        result = self.repository.update(db_obj=db_agent, obj_in=update_data)
        
        # Invalidate cache
        cache_service.delete(f"agent:{agent_id}")
        cache_service.delete_pattern("agents_list:*")
        
        return result

    def delete_agent(self, agent_id: str) -> bool:
        agent = self.repository.remove(id=agent_id)
        
        # Invalidate cache
        if agent:
            cache_service.delete(f"agent:{agent_id}")
            cache_service.delete_pattern("agents_list:*")
        
        return agent is not None
