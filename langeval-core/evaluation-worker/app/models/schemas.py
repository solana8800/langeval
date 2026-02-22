from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class ChatMessage(BaseModel):
    role: str
    content: str

class EvaluationRequest(BaseModel):
    campaign_id: str = "unknown"
    history: List[Dict[str, Any]] # Or List[ChatMessage], but keeping Dict for flexibility based on current usage
    
class MetricResult(BaseModel):
    answer_relevancy: float
    faithfulness: Optional[float] = None
    reason: Optional[str] = None

class EvaluationResult(BaseModel):
    campaign_id: str
    status: str
    total_score: float
    metrics: Dict[str, Any]
    error: Optional[str] = None
