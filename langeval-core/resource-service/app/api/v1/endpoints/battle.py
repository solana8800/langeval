from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session
from app.core.database import get_session
import uuid
from app.api.deps import get_current_workspace, get_current_workspace_or_none
from app.models.domain import (
    BattleCampaign, 
    BattleCampaignCreate, 
    BattleCampaignUpdate,
    BattleTurn,
    BattleTurnCreate,
    Page
)
from app.services.battle_service import BattleService
from math import ceil

router = APIRouter()

@router.post("/campaigns", response_model=BattleCampaign)
def create_campaign(
    *,
    db: Session = Depends(get_session),
    campaign_in: BattleCampaignCreate,
    workspace_id: uuid.UUID = Depends(get_current_workspace)
) -> BattleCampaign:
    """
    Tạo một chiến dịch Battle Arena mới.
    """
    service = BattleService(db, workspace_id)
    return service.create_campaign(campaign_in)

@router.get("/campaigns", response_model=Page[BattleCampaign])
def list_campaigns(
    *,
    db: Session = Depends(get_session),
    page: int = 1,
    size: int = 10,
    workspace_id: uuid.UUID = Depends(get_current_workspace)
) -> Page[BattleCampaign]:
    """
    Lấy danh sách các chiến dịch Battle Arena.
    """
    service = BattleService(db, workspace_id)
    skip = (page - 1) * size
    
    total = len(service.get_multi_campaigns()) # Simplified for now
    items = service.get_multi_campaigns(skip=skip, limit=size)
    
    return Page(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=ceil(total / size) if size > 0 else 0
    )

@router.get("/campaigns/{campaign_id}", response_model=BattleCampaign)
def get_campaign(
    *,
    db: Session = Depends(get_session),
    campaign_id: str,
    workspace_id: uuid.UUID = Depends(get_current_workspace)
) -> BattleCampaign:
    """
    Lấy thông tin chi tiết của một chiến dịch Battle Arena.
    """
    service = BattleService(db, workspace_id)
    campaign = service.get_campaign(campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign

@router.patch("/campaigns/{campaign_id}", response_model=BattleCampaign)
def update_campaign(
    *,
    db: Session = Depends(get_session),
    campaign_id: str,
    campaign_update: BattleCampaignUpdate,
    workspace_id: Optional[uuid.UUID] = Depends(get_current_workspace_or_none)
) -> BattleCampaign:
    """
    Cập nhật thông tin chiến dịch (được gọi từ Orchestrator).
    """
    service = BattleService(db, workspace_id)
    campaign = service.get_campaign(campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    return service.update_campaign(campaign, campaign_update)

@router.get("/campaigns/{campaign_id}/turns", response_model=List[BattleTurn])
def get_campaign_turns(
    *,
    db: Session = Depends(get_session),
    campaign_id: str,
    workspace_id: uuid.UUID = Depends(get_current_workspace)
) -> List[BattleTurn]:
    """
    Lấy danh sách các lượt đấu trong một chiến dịch.
    """
    service = BattleService(db, workspace_id)
    return service.get_turns(campaign_id)

@router.post("/turns", response_model=BattleTurn)
def add_turn(
    *,
    db: Session = Depends(get_session),
    turn_in: BattleTurnCreate,
    workspace_id: Optional[uuid.UUID] = Depends(get_current_workspace_or_none)
) -> BattleTurn:
    """
    Thêm một lượt đấu mới và cập nhật stats cho campaign.
    """
    service = BattleService(db, workspace_id)
    return service.add_turn(turn_in)
