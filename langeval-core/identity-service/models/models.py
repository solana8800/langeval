from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid
from sqlmodel import Field, Relationship, SQLModel
from sqlalchemy import UniqueConstraint, Column
from sqlalchemy.dialects.postgresql import JSONB

# Enum for Workspace Roles
class WorkspaceRole(str):
    OWNER = "OWNER"
    EDITOR = "EDITOR"
    VIEWER = "VIEWER"

# --- User Model ---
class User(SQLModel, table=True):
    __tablename__ = "users"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(index=True, unique=True)
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    google_id: str = Field(index=True, unique=True)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    workspaces: List["WorkspaceMember"] = Relationship(back_populates="user")
    owned_workspaces: List["Workspace"] = Relationship(back_populates="owner")

    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "email": "user@langeval.space",
                "name": "Langeval User",
                "avatar_url": "https://lh3.googleusercontent.com/a/abc",
                "google_id": "123456789",
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z"
            }
        }
    }

# --- Workspace Model ---
class Workspace(SQLModel, table=True):
    __tablename__ = "workspaces"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str
    owner_id: uuid.UUID = Field(foreign_key="users.id")
    is_personal: bool = Field(default=False)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    owner: User = Relationship(back_populates="owned_workspaces")
    members: List["WorkspaceMember"] = Relationship(back_populates="workspace")
    subscription: Optional["Subscription"] = Relationship(
        back_populates="workspace", 
        sa_relationship_kwargs={"uselist": False}
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "660e8400-e29b-41d4-a716-446655441111",
                "name": "Dev Workspace",
                "owner_id": "550e8400-e29b-41d4-a716-446655440000",
                "is_personal": False,
                "created_at": "2024-01-01T00:00:00Z"
            }
        }
    }

# --- Workspace Member Model ---
class WorkspaceMember(SQLModel, table=True):
    __tablename__ = "workspace_members"
    __table_args__ = (
        UniqueConstraint("workspace_id", "user_id", name="unique_workspace_member"),
    )

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    workspace_id: uuid.UUID = Field(foreign_key="workspaces.id")
    user_id: uuid.UUID = Field(foreign_key="users.id")
    role: str = Field(default=WorkspaceRole.VIEWER)
    
    joined_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    workspace: Workspace = Relationship(back_populates="members")
    user: User = Relationship(back_populates="workspaces")

    model_config = {
        "json_schema_extra": {
            "example": {
                "workspace_id": "660e8400-e29b-41d4-a716-446655441111",
                "user_id": "550e8400-e29b-41d4-a716-446655440000",
                "role": "OWNER",
                "joined_at": "2024-01-01T00:00:00Z"
            }
        }
    }

# --- Workspace Invite Model ---
class WorkspaceInvite(SQLModel, table=True):
    __tablename__ = "workspace_invites"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    code: str = Field(index=True, unique=True) # Random string
    email: str
    workspace_id: uuid.UUID = Field(foreign_key="workspaces.id")
    role: str = Field(default=WorkspaceRole.VIEWER)
    
    expires_at: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: uuid.UUID = Field(foreign_key="users.id")

    model_config = {
        "json_schema_extra": {
            "example": {
                "code": "INV-ABC-123",
                "email": "friend@example.com",
                "workspace_id": "660e8400-e29b-41d4-a716-446655441111",
                "role": "EDITOR",
                "expires_at": "2024-12-31T23:59:59Z"
            }
        }
    }

# --- Plan Model ---
class Plan(SQLModel, table=True):
    __tablename__ = "plans"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(index=True, unique=True)
    price_monthly: float = Field(default=0.0)
    price_annual: float = Field(default=0.0)
    features: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSONB))
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    subscriptions: List["Subscription"] = Relationship(back_populates="plan")

    model_config = {
        "json_schema_extra": {
            "example": {
                "name": "Free",
                "price_monthly": 0.0,
                "price_annual": 0.0,
                "features": {"max_workspaces": 1, "max_scenarios": 3, "max_runs_per_month": 50}
            }
        }
    }

# --- Subscription Model ---
class Subscription(SQLModel, table=True):
    __tablename__ = "subscriptions"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    workspace_id: uuid.UUID = Field(foreign_key="workspaces.id", unique=True)
    plan_id: uuid.UUID = Field(foreign_key="plans.id")
    
    status: str = Field(default="active") # active, past_due, canceled, pending
    paypal_sub_id: Optional[str] = None
    
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    workspace: Workspace = Relationship(back_populates="subscription")
    plan: Plan = Relationship(back_populates="subscriptions")

    model_config = {
        "json_schema_extra": {
            "example": {
                "status": "active",
                "period_start": "2024-01-01T00:00:00Z",
                "period_end": "2024-02-01T00:00:00Z"
            }
        }
    }
