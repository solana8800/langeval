from fastapi import APIRouter, Depends, Query, HTTPException
from sqlmodel import Session
from app.core.database import get_session
from app.models.domain import ManualReview, Page, ReviewDecision
from app.services.review_service import ReviewService

router = APIRouter()

def get_service(session: Session = Depends(get_session)) -> ReviewService:
    return ReviewService(session)

@router.post("/", response_model=ManualReview)
def create_review_request(
    review: ManualReview,
    service: ReviewService = Depends(get_service)
):
    """
    Tạo yêu cầu review mới (Internal Use).
    """
    return service.create_review(review)

@router.get("/manual-reviews", response_model=Page[ManualReview])
def list_pending_reviews(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    service: ReviewService = Depends(get_service)
):
    """
    Lấy danh sách các yêu cầu đang chờ duyệt (Pending).
    """
    return service.get_pending_reviews(page, page_size)

@router.post("/manual-reviews/{review_id}/decision", response_model=ManualReview)
def submit_review_decision(
    review_id: str,
    decision: ReviewDecision,
    service: ReviewService = Depends(get_service)
):
    """
    Gửi quyết định duyệt (Approve/Reject/Override).
    """
    updated_review = service.submit_decision(
        review_id, 
        decision.status, 
        decision.human_score, 
        decision.reviewer_notes
    )
    if not updated_review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    return updated_review
