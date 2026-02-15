from typing import List, Optional
from sqlmodel import Session
from app.repositories.metric import MetricRepository
from app.models.domain import MetricConfigRef

class MetricService:
    def __init__(self, session: Session):
        self.repository = MetricRepository(session)

    def create_metric(self, metric: MetricConfigRef) -> MetricConfigRef:
        return self.repository.create(metric)

    def get_metrics(self, offset: int = 0, limit: int = 100) -> List[MetricConfigRef]:
        return self.repository.get_multi(skip=offset, limit=limit)

    def get_metric(self, metric_id: str) -> Optional[MetricConfigRef]:
        return self.repository.get(metric_id)

    def update_metric(self, metric_id: str, update_data: dict) -> Optional[MetricConfigRef]:
        metric = self.repository.get(metric_id)
        if metric:
            return self.repository.update(db_obj=metric, obj_in=update_data)
        return None

    def delete_metric(self, metric_id: str) -> Optional[MetricConfigRef]:
        return self.repository.remove(id=metric_id)
    
    def seed_default_metrics(self, metrics_data: List[dict]) -> List[MetricConfigRef]:
        results = []
        for m_data in metrics_data:
            # Check if exists
            existing = self.repository.get(m_data["id"])
            if not existing:
                metric = MetricConfigRef(**m_data)
                created = self.repository.create(metric)
                results.append(created)
        return results
