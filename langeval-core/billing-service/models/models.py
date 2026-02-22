from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid
from sqlmodel import Field, Relationship, SQLModel
from sqlalchemy import Column, JSON

# Copy definitions from identity-service to share the same DB
class User(SQLModel, table=True):
    __tablename__ = "users"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(index=True, unique=True)

class Workspace(SQLModel, table=True):
    __tablename__ = "workspaces"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str
    owner_id: uuid.UUID = Field(foreign_key="users.id")
    subscription: Optional["Subscription"] = Relationship(back_populates="workspace", sa_relationship_kwargs={"uselist": False})

class Plan(SQLModel, table=True):
    __tablename__ = "plans"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(index=True, unique=True)
    price_monthly: float = Field(default=0.0)
    price_annual: float = Field(default=0.0)
    features: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    subscriptions: List["Subscription"] = Relationship(back_populates="plan")

class Subscription(SQLModel, table=True):
    __tablename__ = "subscriptions"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    workspace_id: uuid.UUID = Field(foreign_key="workspaces.id", unique=True)
    plan_id: uuid.UUID = Field(foreign_key="plans.id")
    status: str = Field(default="active")
    paypal_sub_id: Optional[str] = None
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    workspace: Workspace = Relationship(back_populates="subscription")
    plan: Plan = Relationship(back_populates="subscriptions")

class Transaction(SQLModel, table=True):
    __tablename__ = "transactions"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    workspace_id: uuid.UUID = Field(foreign_key="workspaces.id")
    subscription_id: Optional[uuid.UUID] = Field(default=None, foreign_key="subscriptions.id")
    amount: float
    currency: str = Field(default="USD")
    status: str = Field(default="completed") # completed, pending, failed
    paypal_transaction_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    workspace: Workspace = Relationship()
