from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import Any
from pydantic import BaseModel

from core import security, google_auth
from models.models import User, Workspace, WorkspaceMember, WorkspaceRole, Plan, Subscription
from core.db import get_session

router = APIRouter()

class GoogleLoginRequest(BaseModel):
    id_token: str

class Token(BaseModel):
    access_token: str
    token_type: str

@router.post("/auth/google", response_model=Token)
def login_google(
    login_data: GoogleLoginRequest,
    session: Session = Depends(get_session)
) -> Any:
    # 1. Verify Google Token
    google_user = google_auth.GoogleAuth.verify_token(login_data.id_token)
    if not google_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google ID Token",
        )

    # 2. Check if user exists
    statement = select(User).where(User.google_id == google_user["google_id"])
    user = session.exec(statement).first()

    if not user:
        # 3. Auto-provision User
        user = User(
            email=google_user["email"],
            name=google_user["name"],
            avatar_url=google_user["picture"],
            google_id=google_user["google_id"],
        )
        session.add(user)
        session.commit()
        session.refresh(user)

        # 4. Create Personal Workspace
        workspace = Workspace(
            name=f"{user.name}'s Workspace",
            owner_id=user.id,
            is_personal=True
        )
        session.add(workspace)
        session.commit()
        session.refresh(workspace)

        # 4.1 Assign Free Plan Subscription
        plan = session.exec(select(Plan).where(Plan.name == "Free")).first()
        if plan:
            subscription = Subscription(
                workspace_id=workspace.id,
                plan_id=plan.id
            )
            session.add(subscription)

        # 5. Add user as Owner
        member = WorkspaceMember(
            workspace_id=workspace.id,
            user_id=user.id,
            role=WorkspaceRole.OWNER
        )
        session.add(member)
        session.commit()
    
    # 6. Create Session Token
    access_token = security.create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
    }
