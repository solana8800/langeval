from typing import Optional, List, Dict, TypeVar, Generic
from sqlmodel import Field, SQLModel
from sqlalchemy import JSON, Column, Index
from datetime import datetime
import uuid
import re
from pydantic import validator

# --- Pagination Generic ---
T = TypeVar("T")

class Page(SQLModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    size: int
    pages: int

class AgentBase(SQLModel):
    name: str = Field(index=True)
    description: Optional[str] = None
    endpoint_url: str
    
    # Metadata for UI
    type: str = Field(default="RAG Chatbot") 
    version: str = Field(default="v1.0.0")
    status: str = Field(default="active") # active, maintenance, deprecated
    repo_url: Optional[str] = None
    
    langfuse_project_id: Optional[str] = None
    langfuse_project_name: Optional[str] = None
    langfuse_org_id: Optional[str] = None
    langfuse_org_name: Optional[str] = None
    
    meta_data: Dict = Field(default={}, sa_column=Column(JSON))

class AgentCreate(AgentBase):
    api_key: Optional[str] = None # Plain text input from Client

    @validator("endpoint_url")
    def validate_url(cls, v):
        # Very permissive URL validation to support mock hostnames, local IPs, etc.
        url_regex = re.compile(r'^https?://[^\s/$.?#].[^\s]*$', re.IGNORECASE)
        if not url_regex.match(v):
            raise ValueError("Invalid URL format")
        return v

class AgentRef(AgentBase, table=True):
    """
    Thông tin về Target Bot cần test.
    """
    __tablename__ = "agentref"
    
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    api_key_encrypted: Optional[str] = None # Encrypted at rest
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    
    __table_args__ = (
        Index('idx_agent_status_created', 'status', 'created_at'),
    )

class AgentUpdate(SQLModel):
    name: Optional[str] = None
    description: Optional[str] = None
    endpoint_url: Optional[str] = None
    type: Optional[str] = None
    version: Optional[str] = None
    status: Optional[str] = None
    repo_url: Optional[str] = None
    langfuse_project_id: Optional[str] = None
    langfuse_project_name: Optional[str] = None
    langfuse_org_id: Optional[str] = None
    langfuse_org_name: Optional[str] = None
    api_key: Optional[str] = None
    meta_data: Optional[Dict] = None

class KnowledgeBaseRef(SQLModel, table=True):
    """
    Thông tin về Knowledge Base (Tài liệu upload).
    """
    __tablename__ = "knowledgebaseref"
    
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str = Field(index=True)
    source_path: str # S3 Path or Local Path
    description: Optional[str] = None
    type: str = Field(default="document", index=True) # document, web, notion, confluence
    status: str = Field(default="ready", index=True) # indexing, ready, error
    chunking_strategy: Optional[str] = "fixed-size"
    
    # Vector DB Enhancements
    vector_db_type: Optional[str] = Field(default="chroma") # chroma, qdrant, pinecone
    vector_db_config: Dict = Field(default={}, sa_column=Column(JSON))
    
    meta_data: Dict = Field(default={}, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    
    __table_args__ = (
        Index('idx_kb_type_status', 'type', 'status'),
    )

class KnowledgeBaseUpdate(SQLModel):
    name: Optional[str] = None
    description: Optional[str] = None
    source_path: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None
    chunking_strategy: Optional[str] = None
    vector_db_type: Optional[str] = None
    vector_db_config: Optional[Dict] = None
    meta_data: Optional[Dict] = None

class ScenarioRef(SQLModel, table=True):
    """
    Kịch bản kiểm thử (Scenario Builder).
    """
    __tablename__ = "scenarioref"
    
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str = Field(index=True)
    nodes: List[dict] = Field(default=[], sa_column=Column(JSON))
    edges: List[dict] = Field(default=[], sa_column=Column(JSON))
    description: Optional[str] = None
    agent_id: Optional[str] = Field(default=None, index=True)
    meta_data: Dict = Field(default={}, sa_column=Column(JSON))
    updated_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    
    __table_args__ = (
        Index('idx_scenario_agent_updated', 'agent_id', 'updated_at'),
    )

# --- Strict Schemas ---
class Position(SQLModel):
    x: float
    y: float

class NodeItem(SQLModel):
    id: str
    type: str # 'customNode', 'start', etc.
    position: Position
    data: Dict = Field(default={})
    # ReactFlow specific optional fields
    width: Optional[float] = None
    height: Optional[float] = None
    selected: Optional[bool] = None
    positionAbsolute: Optional[Dict] = None
    dragging: Optional[bool] = None

class EdgeItem(SQLModel):
    id: str
    source: str
    target: str
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None
    type: Optional[str] = None
    animated: Optional[bool] = None
    data: Optional[Dict] = None
    label: Optional[str] = None

class ScenarioCreate(SQLModel):
    name: str
    nodes: List[NodeItem] # Strict validation
    edges: List[EdgeItem] # Strict validation
    description: Optional[str] = None
    agent_id: Optional[str] = None
    meta_data: Optional[Dict] = {}

class ScenarioUpdate(SQLModel):
    name: Optional[str] = None
    nodes: Optional[List[NodeItem]] = None # Strict validation!
    edges: Optional[List[EdgeItem]] = None # Strict validation!
    description: Optional[str] = None
    agent_id: Optional[str] = None
    meta_data: Optional[Dict] = None
    # No ID or updated_at here, handled by logic

class AIScenarioRequest(SQLModel):
    prompt: str
    current_nodes: Optional[List[Dict]] = None
    current_edges: Optional[List[Dict]] = None
    model_id: Optional[str] = None
    agent_id: Optional[str] = None

class MetricConfigRef(SQLModel, table=True):
    """
    Cấu hình Metric (Metrics Library).
    """
    id: str = Field(primary_key=True) # e.g. "faithfulness"
    name: str
    category: str # RAG, Safety, Policy
    definition: Optional[str] = None
    threshold: float = Field(default=0.5)
    enabled: bool = Field(default=True)
    config: dict = Field(default={}, sa_column=Column(JSON))

class ModelRef(SQLModel, table=True):
    """
    Thông tin về LLM Model (Provider connection).
    """
    __tablename__ = "modelref"
    
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str = Field(index=True)
    provider: str = Field(index=True) # OpenAI, Azure, Anthropic, VLLM
    type: str # API, Local
    api_key_encrypted: Optional[str] = None # Encrypted at rest
    base_url: Optional[str] = None
    status: str = Field(default="active", index=True)
    meta_data: Dict = Field(default={}, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    
    __table_args__ = (
        Index('idx_model_provider_status', 'provider', 'status'),
    )

class ModelCreate(SQLModel):
    name: str
    provider: str
    type: str # API, Local
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    meta_data: Optional[Dict] = {}

class ModelUpdate(SQLModel):
    name: Optional[str] = None
    provider: Optional[str] = None
    type: Optional[str] = None
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    status: Optional[str] = None
    meta_data: Optional[Dict] = None

class ManualReview(SQLModel, table=True):
    """
    Yêu cầu duyệt thủ công (Human-in-the-loop).
    """
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    campaign_id: str = Field(index=True)
    test_case_input: str
    actual_output: str
    auto_score: float
    human_score: Optional[float] = None
    status: str = Field(default="pending") # pending, approved, rejected, overridden
    reviewer_notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ReviewDecision(SQLModel):
    status: str
    human_score: Optional[float] = None
    reviewer_notes: Optional[str] = None
class RedTeamingCampaign(SQLModel, table=True):
    """
    Red Teaming Campaign - Chiến dịch tấn công adversarial.
    Lưu trữ cấu hình, tiến độ và báo cáo lỗ hổng.
    """
    __tablename__ = "redteamingcampaign"
    
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str = Field(index=True)
    agent_id: str = Field(index=True) # Target agent ID
    
    # Cấu hình tấn công
    strategy: str = Field(index=True) # jailbreak, prompt-injection, pii-leakage, toxicity
    intensity: int = Field(default=75) # 0-100, quy định số lượng probes
    
    # Trạng thái thực thi
    status: str = Field(default="queued", index=True) # queued, running, completed, failed
    progress: int = Field(default=0) # 0-100%
    
    # Kết quả tổng quan
    total_probes: int = Field(default=0)
    successful_attacks: int = Field(default=0)
    blocked_attacks: int = Field(default=0)
    
    # Báo cáo lỗ hổng (Vulnerability Report)
    critical_count: int = Field(default=0)
    high_count: int = Field(default=0)
    medium_count: int = Field(default=0)
    low_count: int = Field(default=0)
    
    # Dữ liệu chi tiết (JSON)
    # logs lưu danh sách {probe, result, type, timestamp}
    # report_data lưu chi tiết các case nghiêm trọng
    logs: List[Dict] = Field(default=[], sa_column=Column(JSON))
    meta_data: Dict = Field(default={}, sa_column=Column(JSON))
    
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    __table_args__ = (
        Index('idx_redteam_agent_status', 'agent_id', 'status'),
    )

class RedTeamingCampaignCreate(SQLModel):
    name: str
    agent_id: str
    strategy: str
    intensity: Optional[int] = 75
    meta_data: Optional[Dict] = {}

class RedTeamingCampaignUpdate(SQLModel):
    status: Optional[str] = None
    progress: Optional[int] = None
    total_probes: Optional[int] = None
    successful_attacks: Optional[int] = None
    blocked_attacks: Optional[int] = None
    critical_count: Optional[int] = None
    high_count: Optional[int] = None
    medium_count: Optional[int] = None
    low_count: Optional[int] = None
    logs: Optional[List[Dict]] = None
    meta_data: Optional[Dict] = None

# --- Battle Arena Models ---

class BattleCampaign(SQLModel, table=True):
    """
    Chiến dịch so sánh đối kháng giữa 2 Agents (Battle Arena).
    Hỗ trợ 2 chế độ: comparison (A vs B) và adversarial (Sim vs Target).
    """
    __tablename__ = "battlecampaign"
    
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str = Field(index=True)
    status: str = Field(default="queued", index=True) # queued, running, completed, failed
    mode: str = Field(default="adversarial", index=True) # comparison, adversarial
    
    # Configuration
    agent_a_id: Optional[str] = Field(default=None, index=True)
    agent_b_id: Optional[str] = Field(default=None, index=True)
    target_agent_id: Optional[str] = Field(default=None, index=True)
    simulator_id: Optional[str] = Field(default=None, index=True)
    
    scenario_id: Optional[str] = Field(default=None, index=True)
    
    # Metadata
    language: str = Field(default="en")
    max_turns: int = Field(default=10)
    
    # Results
    current_turn: int = Field(default=0)
    agent_a_wins: int = Field(default=0)
    agent_b_wins: int = Field(default=0)
    ties: int = Field(default=0)
    score_sum: float = Field(default=0.0) # Cho adversarial mode
    
    meta_data: Dict = Field(default={}, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class BattleCampaignCreate(SQLModel):
    name: str
    mode: Optional[str] = "adversarial"
    agent_a_id: Optional[str] = None
    agent_b_id: Optional[str] = None
    target_agent_id: Optional[str] = None
    simulator_id: Optional[str] = None
    scenario_id: Optional[str] = None
    language: Optional[str] = "en"
    max_turns: Optional[int] = 10
    meta_data: Optional[Dict] = {}

    meta_data: Optional[Dict] = {}

class BattleCampaignUpdate(SQLModel):
    status: Optional[str] = None
    current_turn: Optional[int] = None
    agent_a_wins: Optional[int] = None
    agent_b_wins: Optional[int] = None
    ties: Optional[int] = None
    score_sum: Optional[float] = None
    meta_data: Optional[Dict] = None

class BattleTurn(SQLModel, table=True):
    """
    Chi tiết từng lượt đấu trong Battle Arena.
    """
    __tablename__ = "battleturn"
    
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    campaign_id: str = Field(index=True)
    turn_number: int
    
    # Input content
    user_message: str
    
    # Responses
    agent_a_response: str # Trong adversarial, đây là phản hồi của target agent
    agent_b_response: Optional[str] = None
    
    # Metadata
    agent_a_latency_ms: float = Field(default=0)
    agent_b_latency_ms: float = Field(default=0)
    
    # Evaluation result
    winner: str = Field(default="tie") # agent_a, agent_b, tie, target (for adversarial)
    score: float = Field(default=0) # Điểm số cho adversarial turn
    judge_reasoning: Optional[str] = None
    confidence: float = Field(default=0)
    
    meta_data: Dict = Field(default={}, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)

class BattleTurnCreate(SQLModel):
    campaign_id: str
    turn_number: int
    user_message: str
    agent_a_response: str
    agent_b_response: Optional[str] = None
    agent_a_latency_ms: Optional[float] = 0
    agent_b_latency_ms: Optional[float] = 0
    winner: Optional[str] = "tie"
    score: Optional[float] = 0
    judge_reasoning: Optional[str] = None
    confidence: Optional[float] = 0
    meta_data: Optional[Dict] = {}

# --- Benchmark Models ---

class BenchmarkResult(SQLModel, table=True):
    """
    Lưu trữ kết quả chạy Benchmark.
    """
    __tablename__ = "benchmarkresult"

    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    benchmark_id: str = Field(index=True) # mmlu, gsm8k, etc.
    model_id: str = Field(index=True)
    
    score: float
    total_items: int
    correct_items: int
    
    # JSON Details (List of {question, answer, correct, ...})
    details: List[Dict] = Field(default=[], sa_column=Column(JSON))
    
    status: str = Field(default="completed", index=True)
    meta_data: Dict = Field(default={}, sa_column=Column(JSON))
    
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)

class BenchmarkResultCreate(SQLModel):
    benchmark_id: str
    model_id: str
    score: float
    total_items: int
    correct_items: int
    details: Optional[List[Dict]] = []
    status: Optional[str] = "completed"
    meta_data: Optional[Dict] = {}
