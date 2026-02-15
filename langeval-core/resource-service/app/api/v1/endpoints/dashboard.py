from fastapi import APIRouter, Depends
from app.services.dashboard_service import DashboardService

router = APIRouter()

def get_service():
    return DashboardService()

@router.get("/summary")
def get_summary(service: DashboardService = Depends(get_service)):
    """
    Get high-level dashboard statistics.
    """
    return service.get_summary_stats()

@router.get("/trends")
def get_trends(days: int = 7, service: DashboardService = Depends(get_service)):
    """
    Get evaluation score trends over time.
    """
    return service.get_trend_data(days)

@router.get("/metrics-breakdown")
def get_metrics_breakdown(service: DashboardService = Depends(get_service)):
    """
    Get average scores broken down by metric.
    """
    return service.get_metric_breakdown()
