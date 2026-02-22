import uuid
from typing import List, Optional
from math import ceil
from sqlmodel import Session, func, select
from app.repositories.scenario import ScenarioRepository
from app.models.domain import ScenarioRef, ScenarioUpdate, ScenarioCreate, Page
from app.core.cache import cached, cache_service

class ScenarioService:
    def __init__(self, session: Session, workspace_id: uuid.UUID = None):
        self.repository = ScenarioRepository(session)
        self.session = session
        self.workspace_id = workspace_id

    def create_scenario(self, scenario_in: ScenarioCreate) -> ScenarioRef:
        data = scenario_in.dict()
        if self.workspace_id:
            data["workspace_id"] = self.workspace_id
        db_scenario = ScenarioRef(**data)
        return self.repository.create(db_scenario)

    @cached(key_prefix="scenario", ttl=60)  # Cache 1 phút
    def get_scenario(self, scenario_id: str) -> Optional[ScenarioRef]:
        scenario = self.repository.get(scenario_id)
        if scenario and self.workspace_id and scenario.workspace_id != self.workspace_id:
             return None
        return scenario

    def get_scenarios(self, page: int = 1, page_size: int = 10, agent_id: Optional[str] = None, search: Optional[str] = None) -> Page[ScenarioRef]:
        # Calculate offset
        offset = (page - 1) * page_size
        
        # Build Query
        statement = select(ScenarioRef)
        
        if self.workspace_id:
            statement = statement.where(ScenarioRef.workspace_id == self.workspace_id)
        
        # Apply Filters
        if agent_id and agent_id != "all":
            statement = statement.where(ScenarioRef.agent_id == agent_id)
            
        if search:
            statement = statement.where(ScenarioRef.name.contains(search))
            
        # Get Total Count (with filters)
        count_statement = select(func.count()).select_from(statement.subquery())
        total = self.session.exec(count_statement).one()
        
        # Apply Pagination
        statement = statement.offset(offset).limit(page_size).order_by(ScenarioRef.updated_at.desc())
        items = self.session.exec(statement).all()
        
        pages = ceil(total / page_size) if page_size > 0 else 0
        
        return Page(
            items=items,
            total=total,
            page=page,
            size=page_size,
            pages=pages
        )

    def update_scenario(self, scenario_id: str, scenario_update: ScenarioUpdate) -> Optional[ScenarioRef]:
        db_scenario = self.repository.get(scenario_id)
        if not db_scenario:
            return None
            
        if self.workspace_id and db_scenario.workspace_id != self.workspace_id:
            return None
        
        result = self.repository.update(db_obj=db_scenario, obj_in=scenario_update)
        
        # Invalidate cache
        cache_service.delete(f"scenario:{scenario_id}")
        cache_service.delete_pattern("scenarios_list:*")
        
        return result

    def delete_scenario(self, scenario_id: str) -> bool:
        # Check permissions first
        if self.workspace_id:
            db_scenario = self.repository.get(scenario_id)
            if db_scenario and db_scenario.workspace_id != self.workspace_id:
                 return False

        scenario = self.repository.remove(id=scenario_id)
        
        # Invalidate cache
        if scenario:
            cache_service.delete(f"scenario:{scenario_id}")
            cache_service.delete_pattern("scenarios_list:*")
        
        return scenario is not None
