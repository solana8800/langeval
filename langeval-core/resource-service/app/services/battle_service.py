from typing import List, Optional, Dict
from sqlmodel import Session
from app.models.domain import BattleCampaign, BattleCampaignCreate, BattleCampaignUpdate, BattleTurn, BattleTurnCreate
from app.repositories.battle import BattleCampaignRepository, BattleTurnRepository
import uuid

class BattleService:
    def __init__(self, db: Session, workspace_id: Optional[uuid.UUID] = None):
        self.campaign_repo = BattleCampaignRepository(db)
        self.turn_repo = BattleTurnRepository(db)
        self.workspace_id = workspace_id
        self.session = db

    # --- Campaign CRUD ---
    def create_campaign(self, obj_in: BattleCampaignCreate) -> BattleCampaign:
        data = obj_in.dict()
        if self.workspace_id:
            data["workspace_id"] = self.workspace_id
            
        db_obj = BattleCampaign(
            id=str(uuid.uuid4()),
            **data
        )
        return self.campaign_repo.create(db_obj)

    def get_campaign(self, id: str) -> Optional[BattleCampaign]:
        campaign = self.campaign_repo.get(id)
        if campaign and self.workspace_id and campaign.workspace_id != self.workspace_id:
            return None
        return campaign

    def get_multi_campaigns(self, skip: int = 0, limit: int = 100) -> List[BattleCampaign]:
        from sqlmodel import select
        statement = select(BattleCampaign)
        if self.workspace_id:
            statement = statement.where(BattleCampaign.workspace_id == self.workspace_id)
        statement = statement.offset(skip).limit(limit).order_by(BattleCampaign.created_at.desc())
        return self.session.exec(statement).all()

    def update_campaign(self, db_obj: BattleCampaign, obj_in: BattleCampaignUpdate) -> BattleCampaign:
        if self.workspace_id and db_obj.workspace_id != self.workspace_id:
            return db_obj # Or raise error, but here we just ignore
            
        return self.campaign_repo.update(db_obj=db_obj, obj_in=obj_in)

    # --- Turn Management ---
    def add_turn(self, obj_in: BattleTurnCreate) -> BattleTurn:
        db_obj = BattleTurn(
            id=str(uuid.uuid4()),
            **obj_in.dict()
        )
        turn = self.turn_repo.create(db_obj)
        
        # After adding a turn, update campaign stats
        campaign = self.get_campaign(obj_in.campaign_id)
        if campaign:
            update_data = {
                "current_turn": obj_in.turn_number
            }
            if campaign.mode == "adversarial":
                update_data["score_sum"] = (campaign.score_sum or 0) + (obj_in.score or 0)
            else:
                if obj_in.winner == "agent_a":
                    update_data["agent_a_wins"] = (campaign.agent_a_wins or 0) + 1
                elif obj_in.winner == "agent_b":
                    update_data["agent_b_wins"] = (campaign.agent_b_wins or 0) + 1
                elif obj_in.winner == "tie":
                    update_data["ties"] = (campaign.ties or 0) + 1
            
            self.update_campaign(campaign, BattleCampaignUpdate(**update_data))
            
        return turn

    def get_turns(self, campaign_id: str) -> List[BattleTurn]:
        return self.turn_repo.get_by_campaign(campaign_id)
