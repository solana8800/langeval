from sqlmodel import Session
from app.models.domain import RedTeamingCampaign, RedTeamingCampaignUpdate
from app.repositories.base import BaseRepository
from datetime import datetime

class RedTeamingRepository(BaseRepository[RedTeamingCampaign, RedTeamingCampaignUpdate]):
    def __init__(self, session: Session):
        super().__init__(RedTeamingCampaign, session)

    def update(self, *, db_obj: RedTeamingCampaign, obj_in: RedTeamingCampaignUpdate) -> RedTeamingCampaign:
        # Tự động cập nhật thời gian updated_at
        if obj_in.dict(exclude_unset=True):
           db_obj.updated_at = datetime.utcnow()
        return super().update(db_obj=db_obj, obj_in=obj_in)
