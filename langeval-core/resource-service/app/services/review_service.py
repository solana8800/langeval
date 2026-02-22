from typing import List, Optional
from sqlmodel import Session, select
from datetime import datetime
from app.models.domain import ManualReview, Page

class ReviewService:
    def __init__(self, session: Session):
        self.session = session

    def create_review(self, review: ManualReview) -> ManualReview:
        self.session.add(review)
        self.session.commit()
        self.session.refresh(review)
        return review

    def get_pending_reviews(self, page: int = 1, page_size: int = 10) -> Page[ManualReview]:
        query = select(ManualReview).where(ManualReview.status == "pending")
        
        # Count total
        total_count = len(self.session.exec(query).all())
        
        # Pagination
        query = query.offset((page - 1) * page_size).limit(page_size)
        items = self.session.exec(query).all()
        
        # Calculate totals
        total_pages = 0
        if total_count > 0:
            import math
            total_pages = math.ceil(total_count / page_size)

        return Page(
            items=items,
            total=total_count,
            page=page,
            size=page_size,
            pages=total_pages
        )

    def submit_decision(self, review_id: str, status: str, human_score: Optional[float] = None, notes: Optional[str] = None) -> Optional[ManualReview]:
        review = self.session.get(ManualReview, review_id)
        if not review:
            return None
        
        review.status = status
        if human_score is not None:
            review.human_score = human_score
        if notes:
            review.reviewer_notes = notes
        
        review.updated_at = datetime.utcnow()
        self.session.add(review)
        self.session.commit()
        self.session.refresh(review)
        return review
