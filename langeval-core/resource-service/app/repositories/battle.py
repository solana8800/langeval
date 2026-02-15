from sqlmodel import Session, select
from app.models.domain import BattleCampaign, BattleCampaignUpdate, BattleTurn
from app.repositories.base import BaseRepository
from datetime import datetime
from typing import List

class BattleCampaignRepository(BaseRepository[BattleCampaign, BattleCampaignUpdate]):
    def __init__(self, session: Session):
        super().__init__(BattleCampaign, session)

    def update(self, *, db_obj: BattleCampaign, obj_in: BattleCampaignUpdate) -> BattleCampaign:
        db_obj.updated_at = datetime.utcnow()
        return super().update(db_obj=db_obj, obj_in=obj_in)

class BattleTurnRepository(BaseRepository[BattleTurn, BattleTurn]):
    def __init__(self, session: Session):
        super().__init__(BattleTurn, session)

    def get_by_campaign(self, campaign_id: str) -> List[BattleTurn]:
        statement = select(self.model).where(self.model.campaign_id == campaign_id).order_by(self.model.turn_number)
        return self.session.exec(statement).all()
