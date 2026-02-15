from typing import List, Optional, Dict
from sqlmodel import Session
from app.models.domain import RedTeamingCampaign, RedTeamingCampaignCreate, RedTeamingCampaignUpdate
from app.repositories.red_teaming import RedTeamingRepository
import uuid

class RedTeamingService:
    def __init__(self, db: Session):
        self.repository = RedTeamingRepository(db)

    def create(self, obj_in: RedTeamingCampaignCreate) -> RedTeamingCampaign:
        db_obj = RedTeamingCampaign(
            id=str(uuid.uuid4()),
            **obj_in.dict()
        )
        return self.repository.create(db_obj)

    def get(self, id: str) -> Optional[RedTeamingCampaign]:
        return self.repository.get(id)

    def get_multi(self, skip: int = 0, limit: int = 100) -> List[RedTeamingCampaign]:
        return self.repository.get_multi(skip=skip, limit=limit)

    def update(self, db_obj: RedTeamingCampaign, obj_in: RedTeamingCampaignUpdate) -> RedTeamingCampaign:
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
