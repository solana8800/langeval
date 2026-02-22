import operator
from typing import Annotated, TypedDict, List, Dict, Any, Literal, Optional
from langchain_core.messages import BaseMessage
from pydantic import BaseModel

def merge_metrics(left: Dict[str, float], right: Dict[str, float]) -> Dict[str, float]:
    res = left.copy()
    res.update(right)
    return res

# --- Graph State Models ---
class CampaignState(TypedDict):
    """
    Trạng thái của một Campaign Test.
    """
    campaign_id: str
    scenario_id: str
    
    # Lịch sử hội thoại giữa User Simulator và Target Bot
    messages: Annotated[List[BaseMessage], operator.add]
    
    # Trạng thái hiện tại của Workflow
    status: Literal['running', 'paused', 'completed', 'failed']
    
    # Kết quả đánh giá
    raw_score_sum: Annotated[float, operator.add]
    current_score: float
    metrics: Annotated[Dict[str, float], merge_metrics]
    
    # Metadata bổ sung (ví dụ: config params)
    metadata: Dict[str, Any]
    
    # Error state
    error: Optional[str]
    
    # Validation Expectations from Scenario
    expectations: Optional[List[Dict[str, Any]]]

    # Internal: Condition Result for Routing
    _condition_result: Optional[str]

    # Cyclic Logic State
    retry_count: int
    
# --- Red Teaming State ---
class RedTeamingState(TypedDict):
    campaign_id: str
    agent_id: str
    status: str
    progress: int
    
    # Số lượng đòn tấn công (tích lũy)
    total_probes: Annotated[int, operator.add]
    successful_attacks: Annotated[int, operator.add]
    blocked_attacks: Annotated[int, operator.add]
    
    # Thống kê lỗ hổng (tích lũy)
    critical_count: Annotated[int, operator.add]
    high_count: Annotated[int, operator.add]
    medium_count: Annotated[int, operator.add]
    low_count: Annotated[int, operator.add]
    
    # Dữ liệu hội thoại và logs (tích lũy)
    messages: Annotated[List[Any], operator.add]
    logs: Annotated[List[Dict[str, Any]], operator.add]
    
    metadata: Dict[str, Any]
    metrics: Annotated[Dict[str, float], merge_metrics]

# --- API Request/Response Models ---
class CreateCampaignRequest(BaseModel):
    scenario_id: str
    scenario_name: Optional[str] = "Untitled"
    agent_id: Optional[str] = None
    language: str = "en"
    metadata: Dict[str, Any] = {}

    model_config = {
        "json_schema_extra": {
            "example": {
                "scenario_id": "scen-123",
                "scenario_name": "Login Flow Test",
                "agent_id": "agent-456",
                "language": "vi",
                "metadata": {"created_by": "admin"}
            }
        }
    }

class CampaignResponse(BaseModel):
    campaign_id: str
    status: str
    current_score: float
    messages: Optional[List[Dict[str, Any]]] = []

    model_config = {
        "json_schema_extra": {
            "example": {
                "campaign_id": "camp-12345",
                "status": "completed",
                "current_score": 0.95,
                "messages": [
                    {"role": "user", "content": "Hello"},
                    {"role": "assistant", "content": "Hi there!"}
                ]
            }
        }
    }

# --- Battle Arena State ---
class BattleArenaState(TypedDict):
    campaign_id: str
    mode: Literal['comparison', 'adversarial']
    
    # IDs cho Comparison Mode
    agent_a_id: Optional[str]
    agent_b_id: Optional[str]
    
    # IDs cho Adversarial Mode
    target_agent_id: Optional[str]
    simulator_id: Optional[str]
    
    scenario_id: Optional[str]
    status: str
    current_turn: Annotated[int, operator.add]
    max_turns: int
    
    # Kết quả tích lũy (Comparison)
    agent_a_wins: Annotated[int, operator.add]
    agent_b_wins: Annotated[int, operator.add]
    ties: Annotated[int, operator.add]
    
    # Kết quả tích lũy (Adversarial)
    score_sum: Annotated[float, operator.add]
    
    # Lịch sử hội thoại
    messages: Annotated[List[Dict[str, Any]], operator.add]
    
    # Temporary Turn Data
    user_message: Optional[str]
    agent_a_response: Optional[str]
    agent_b_response: Optional[str]
    agent_response: Optional[str] # Cho Adversarial mode
    
    language: str
    metadata: Dict[str, Any]
    error: Optional[str]

# --- Battle Arena API Models ---
class CreateBattleRequest(BaseModel):
    campaign_id: str
    mode: str = "adversarial" # "comparison" hoặc "adversarial"
    agent_a_id: Optional[str] = None
    agent_b_id: Optional[str] = None
    target_agent_id: Optional[str] = None
    simulator_id: Optional[str] = None
    scenario_id: Optional[str] = None
    language: str = "en"
    max_turns: int = 10
    metadata: Dict[str, Any] = {}

    model_config = {
        "json_schema_extra": {
            "example": {
                "campaign_id": "battle-xyz",
                "mode": "adversarial",
                "target_agent_id": "agent-1",
                "simulator_id": "agent-2",
                "max_turns": 5,
                "language": "vi"
            }
        }
    }
