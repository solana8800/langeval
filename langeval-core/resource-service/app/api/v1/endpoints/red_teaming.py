from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session
from app.core.database import get_session
from app.models.domain import (
    RedTeamingCampaign, 
    RedTeamingCampaignCreate, 
    RedTeamingCampaignUpdate,
    Page
)
from app.services.red_teaming_service import RedTeamingService
from math import ceil

router = APIRouter()

@router.post("/campaigns", response_model=RedTeamingCampaign)
def create_campaign(
    *,
    db: Session = Depends(get_session),
    campaign_in: RedTeamingCampaignCreate
) -> RedTeamingCampaign:
    """
    Tạo một chiến dịch Red Teaming mới.
    """
    service = RedTeamingService(db)
    # TODO: Trigger Orchestrator workflow sau khi tạo campaign
    return service.create(campaign_in)

@router.get("/campaigns", response_model=Page[RedTeamingCampaign])
def list_campaigns(
    *,
    db: Session = Depends(get_session),
    page: int = 1,
    size: int = 10,
    agent_id: str = None
) -> Page[RedTeamingCampaign]:
    """
    Lấy danh sách các chiến dịch Red Teaming.
    """
    service = RedTeamingService(db)
    skip = (page - 1) * size
    
    # Simple direct query for now, can be improved with service-level filtering
    from sqlmodel import select, func
    statement = select(RedTeamingCampaign)
    if agent_id:
        statement = statement.where(RedTeamingCampaign.agent_id == agent_id)
    
    total = db.exec(select(func.count()).select_from(statement.subquery())).one()
    items = db.exec(statement.offset(skip).limit(size).order_by(RedTeamingCampaign.created_at.desc())).all()
    
    return Page(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=ceil(total / size) if size > 0 else 0
    )

@router.get("/campaigns/{campaign_id}", response_model=RedTeamingCampaign)
def get_campaign(
    *,
    db: Session = Depends(get_session),
    campaign_id: str
) -> RedTeamingCampaign:
    """
    Lấy thông tin chi tiết của một chiến dịch.
    """
    service = RedTeamingService(db)
    campaign = service.get(campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign

@router.get("/campaigns/{campaign_id}/logs")
def get_campaign_logs(
    *,
    db: Session = Depends(get_session),
    campaign_id: str
):
    """
    Lấy logs tấn công của một chiến dịch.
    """
    service = RedTeamingService(db)
    campaign = service.get(campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return {"data": campaign.logs}

@router.get("/campaigns/{campaign_id}/stats")
def get_campaign_stats(
    *,
    db: Session = Depends(get_session),
    campaign_id: str
):
    """
    Lấy thống kê lỗ hổng của một chiến dịch.
    """
    service = RedTeamingService(db)
    campaign = service.get(campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    return {
        "critical": campaign.critical_count,
        "high": campaign.high_count,
        "medium": campaign.medium_count,
        "low": campaign.low_count,
        "successRate": round((campaign.successful_attacks / campaign.total_probes * 100), 2) if campaign.total_probes > 0 else 0
    }

@router.patch("/campaigns/{campaign_id}", response_model=RedTeamingCampaign)
def update_campaign(
    *,
    db: Session = Depends(get_session),
    campaign_id: str,
    campaign_update: RedTeamingCampaignUpdate
) -> RedTeamingCampaign:
    """
    Cập nhật thông tin chiến dịch Red Teaming (được gọi từ Orchestrator).
    """
    service = RedTeamingService(db)
    campaign = service.get(campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    return service.update(campaign, campaign_update)
