from typing import List, Optional, Dict
from sqlmodel import Session
from app.models.domain import RedTeamingCampaign, RedTeamingCampaignCreate, RedTeamingCampaignUpdate
from app.repositories.red_teaming import RedTeamingRepository
import uuid

class RedTeamingService:
    def __init__(self, db: Session, workspace_id: Optional[uuid.UUID] = None):
        self.repository = RedTeamingRepository(db)
        self.workspace_id = workspace_id
        self.session = db

    def create(self, obj_in: RedTeamingCampaignCreate) -> RedTeamingCampaign:
        data = obj_in.dict()
        if self.workspace_id:
            data["workspace_id"] = self.workspace_id
            
        db_obj = RedTeamingCampaign(
            id=str(uuid.uuid4()),
            **data
        )
        return self.repository.create(db_obj)

    def get(self, id: str) -> Optional[RedTeamingCampaign]:
        campaign = self.repository.get(id)
        if campaign and self.workspace_id and campaign.workspace_id != self.workspace_id:
            return None
        return campaign

    def get_multi(self, skip: int = 0, limit: int = 100) -> List[RedTeamingCampaign]:
        from sqlmodel import select
        statement = select(RedTeamingCampaign)
        if self.workspace_id:
            statement = statement.where(RedTeamingCampaign.workspace_id == self.workspace_id)
        statement = statement.offset(skip).limit(limit).order_by(RedTeamingCampaign.created_at.desc())
        return self.session.exec(statement).all()

    def update(self, db_obj: RedTeamingCampaign, obj_in: RedTeamingCampaignUpdate) -> RedTeamingCampaign:
        if self.workspace_id and db_obj.workspace_id != self.workspace_id:
            return db_obj
        return self.repository.update(db_obj=db_obj, obj_in=obj_in)

    def add_log(self, campaign_id: str, log_entry: Dict) -> Optional[RedTeamingCampaign]:
        db_obj = self.get(campaign_id)
        if not db_obj:
            return None
        
        # Cập nhật list logs hiện tại
        current_logs = list(db_obj.logs) if db_obj.logs else []
        current_logs.append(log_entry)
        
        # Cập nhật stats dựa trên log_entry nếu cần
        update_data = {"logs": current_logs}
        
        # Nếu attack thành công/bị chặn, cập nhật counters
        if log_entry.get("type") == "success":
            update_data["successful_attacks"] = (db_obj.successful_attacks or 0) + 1
        elif log_entry.get("type") == "blocked":
            update_data["blocked_attacks"] = (db_obj.blocked_attacks or 0) + 1
            
        update_obj = RedTeamingCampaignUpdate(**update_data)
        return self.update(db_obj, update_obj)
