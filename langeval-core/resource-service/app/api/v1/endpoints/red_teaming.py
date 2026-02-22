from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session
from app.core.database import get_session
import uuid
from app.api.deps import get_current_workspace, get_current_workspace_or_none
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
    campaign_in: RedTeamingCampaignCreate,
    workspace_id: uuid.UUID = Depends(get_current_workspace)
) -> RedTeamingCampaign:
    """
    Tạo một chiến dịch Red Teaming mới.
    """
    service = RedTeamingService(db, workspace_id)
    # TODO: Trigger Orchestrator workflow sau khi tạo campaign
    return service.create(campaign_in)

@router.get("/campaigns", response_model=Page[RedTeamingCampaign])
def list_campaigns(
    *,
    db: Session = Depends(get_session),
    page: int = 1,
    size: int = 10,
    agent_id: str = None,
    workspace_id: uuid.UUID = Depends(get_current_workspace)
) -> Page[RedTeamingCampaign]:
    """
    Lấy danh sách các chiến dịch Red Teaming.
    """
    service = RedTeamingService(db, workspace_id)
    skip = (page - 1) * size
    
    # Simple direct query for now, can be improved with service-level filtering
    # But wait, I updated service.get_multi to support filtering by workspace_id
    # I should use service.get_multi here if possible, but the original implementation did a custom query.
    # The original implementation:
    # from sqlmodel import select, func
    # statement = select(RedTeamingCampaign)
    # if agent_id: ...
    #
    # I should prefer using the service method `get_multi` which I updated.
    # But `get_multi` in service I just updated to:
    # def get_multi(self, skip, limit):
    #    statement = select(RedTeamingCampaign).where(workspace_id)
    #
    # But the endpoint has `agent_id` filtering. My service `get_multi` DOES NOT support `agent_id` filtering yet.
    # I should stick to the custom query in the endpoint for now, but ADD workspace_id filter.
    
    from sqlmodel import select, func
    statement = select(RedTeamingCampaign)
    if agent_id:
        statement = statement.where(RedTeamingCampaign.agent_id == agent_id)
    
    if workspace_id:
        statement = statement.where(RedTeamingCampaign.workspace_id == workspace_id)
    
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
    campaign_id: str,
    workspace_id: uuid.UUID = Depends(get_current_workspace)
) -> RedTeamingCampaign:
    """
    Lấy thông tin chi tiết của một chiến dịch.
    """
    service = RedTeamingService(db, workspace_id)
    campaign = service.get(campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign

@router.get("/campaigns/{campaign_id}/logs")
def get_campaign_logs(
    *,
    db: Session = Depends(get_session),
    campaign_id: str,
    workspace_id: uuid.UUID = Depends(get_current_workspace)
):
    """
    Lấy logs tấn công của một chiến dịch.
    """
    service = RedTeamingService(db, workspace_id)
    campaign = service.get(campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return {"data": campaign.logs}

@router.get("/campaigns/{campaign_id}/stats")
def get_campaign_stats(
    *,
    db: Session = Depends(get_session),
    campaign_id: str,
    workspace_id: uuid.UUID = Depends(get_current_workspace)
):
    """
    Lấy thống kê lỗ hổng của một chiến dịch.
    """
    service = RedTeamingService(db, workspace_id)
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
    campaign_update: RedTeamingCampaignUpdate,
    workspace_id: Optional[uuid.UUID] = Depends(get_current_workspace_or_none)
) -> RedTeamingCampaign:
    """
    Cập nhật thông tin chiến dịch Red Teaming (được gọi từ Orchestrator).
    """
    service = RedTeamingService(db, workspace_id)
    campaign = service.get(campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    return service.update(campaign, campaign_update)
