
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.models import Campaign
import json

class CampaignRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_campaign(self, campaign_data: dict) -> Campaign:
        db_campaign = Campaign(**campaign_data)
        self.session.add(db_campaign)
        await self.session.commit()
        await self.session.refresh(db_campaign)
        return db_campaign

    async def get_campaign(self, campaign_id: str) -> Campaign:
        result = await self.session.execute(select(Campaign).where(Campaign.id == campaign_id))
        return result.scalars().first()

    async def update_status(self, campaign_id: str, status: str, score: float = None, metrics: dict = None):
        result = await self.session.execute(select(Campaign).where(Campaign.id == campaign_id))
        campaign = result.scalars().first()
        
        if campaign:
            campaign.status = status
            if score is not None:
                campaign.current_score = score
            if metrics:
                campaign.metrics = metrics
            await self.session.commit()
            await self.session.refresh(campaign)
        return campaign
