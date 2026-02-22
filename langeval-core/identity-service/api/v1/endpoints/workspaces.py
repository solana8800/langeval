from typing import List, Optional
import uuid
from datetime import datetime, timedelta
from jose import jwt, JWTError
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from sqlmodel import Field, Session, SQLModel, select, Relationship

from models.models import User, Workspace, WorkspaceRole, WorkspaceMember, WorkspaceInvite, Plan, Subscription
from core.db import get_session
from core import security

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/google")

# --- Response Models ---
class UserRead(BaseModel):
    id: uuid.UUID
    email: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None

class WorkspaceRead(BaseModel):
    id: uuid.UUID
    name: str
    is_personal: bool
    role: str

class WorkspaceCreate(BaseModel):
    name: str

class WorkspaceInvite(BaseModel):
    email: str
    role: str = WorkspaceRole.VIEWER

class MemberRead(BaseModel):
    user_id: uuid.UUID
    email: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str
    joined_at: datetime

# --- Dependency ---
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: Session = Depends(get_session)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = session.get(User, uuid.UUID(user_id))
    if user is None:
        raise credentials_exception
    return user

# --- Endpoints ---

@router.get("/me", response_model=UserRead)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/workspaces", response_model=List[WorkspaceRead])
def read_workspaces(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Join WorkspaceMember + Workspace to get role and workspace details
    statement = select(Workspace, WorkspaceMember.role).join(WorkspaceMember).where(WorkspaceMember.user_id == current_user.id)
    results = session.exec(statement).all()
    
    return [
        WorkspaceRead(
            id=w.id,
            name=w.name,
            is_personal=w.is_personal,
            role=role # role from WorkspaceMember
        ) for w, role in results
    ]

@router.post("/workspaces", response_model=WorkspaceRead)
def create_workspace(
    workspace_in: WorkspaceCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Create Workspace
    workspace = Workspace(
        name=workspace_in.name,
        owner_id=current_user.id,
        is_personal=False
    )
    session.add(workspace)
    session.commit()
    session.refresh(workspace)

    # Assign Free Plan Subscription
    plan = session.exec(select(Plan).where(Plan.name == "Free")).first()
    if plan:
        subscription = Subscription(
            workspace_id=workspace.id,
            plan_id=plan.id
        )
        session.add(subscription)

    # Add Creator as OWNER
    member = WorkspaceMember(
        workspace_id=workspace.id,
        user_id=current_user.id,
        role=WorkspaceRole.OWNER
    )
    session.add(member)
    session.commit()

    return WorkspaceRead(
        id=workspace.id,
        name=workspace.name,
        is_personal=workspace.is_personal,
        role=WorkspaceRole.OWNER
    )

@router.get("/workspaces/{workspace_id}/members", response_model=List[MemberRead])
def list_members(
    workspace_id: uuid.UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # 1. Check permission (Must be member)
    statement = select(WorkspaceMember).where(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == current_user.id
    )
    current_member = session.exec(statement).first()
    if not current_member:
         raise HTTPException(status_code=403, detail="Not a member of this workspace")

    # 2. Get Members
    statement = select(WorkspaceMember, User).join(User).where(WorkspaceMember.workspace_id == workspace_id)
    results = session.exec(statement).all()
    
    return [
        MemberRead(
            user_id=u.id,
            email=u.email,
            name=u.name,
            avatar_url=u.avatar_url,
            role=m.role,
            joined_at=m.joined_at
        ) for m, u in results
    ]

from datetime import datetime, timedelta
import secrets

# ... existing imports ...
from models.models import User, Workspace, WorkspaceMember, WorkspaceRole, WorkspaceInvite

# ... existing models ...

class InviteCreate(BaseModel):
    email: str
    role: str = WorkspaceRole.VIEWER

class InviteRead(BaseModel):
    code: str
    email: str
    workspace_name: str
    expires_at: datetime
    invite_link: str

# ... existing endpoints ...

@router.delete("/workspaces/{workspace_id}/members/{user_id}")
def remove_member(
    workspace_id: uuid.UUID,
    user_id: uuid.UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # 1. Check permission (Must be OWNER)
    statement = select(WorkspaceMember).where(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == current_user.id
    )
    requester = session.exec(statement).first()
    if not requester or requester.role != WorkspaceRole.OWNER:
         raise HTTPException(status_code=403, detail="Only owners can remove members")

    # 2. Cannot remove self (must delete workspace or leave)
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot remove yourself. Leave workspace instead.")

    # 3. Find member to remove
    statement = select(WorkspaceMember).where(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == user_id
    )
    member_to_remove = session.exec(statement).first()
    if not member_to_remove:
        raise HTTPException(status_code=404, detail="Member not found")

    session.delete(member_to_remove)
    session.commit()
    return {"ok": True}

@router.post("/workspaces/{workspace_id}/invites", response_model=InviteRead)
def create_invite(
    workspace_id: uuid.UUID,
    invite_in: InviteCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # 1. Check permission (Must be OWNER or EDITOR)
    statement = select(WorkspaceMember).where(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == current_user.id
    )
    member = session.exec(statement).first()
    if not member or member.role not in [WorkspaceRole.OWNER, WorkspaceRole.EDITOR]:
         raise HTTPException(status_code=403, detail="Not enough permissions")

    # 2. Generate Code
    code = secrets.token_urlsafe(16)
    expires_at = datetime.utcnow() + timedelta(days=7) # 7 days expiry

    # 3. Save Invite
    invite = WorkspaceInvite(
        code=code,
        email=invite_in.email,
        workspace_id=workspace_id,
        role=invite_in.role,
        expires_at=expires_at,
        created_by=current_user.id
    )
    session.add(invite)
    session.commit()
    session.refresh(invite)
    
    # 4. Return Link (Frontend URL)
    # Using a hardcoded base URL for now, strictly should come from config
    invite_link = f"http://localhost:3000/invite/{code}" 
    
    workspace = session.get(Workspace, workspace_id)

    return InviteRead(
        code=code,
        email=invite.email,
        workspace_name=workspace.name,
        expires_at=invite.expires_at,
        invite_link=invite_link
    )

@router.get("/workspaces/{workspace_id}/invites", response_model=List[InviteRead])
def list_invites(
    workspace_id: uuid.UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # 1. Check permission (Must be member)
    statement = select(WorkspaceMember).where(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == current_user.id
    )
    current_member = session.exec(statement).first()
    if not current_member:
         raise HTTPException(status_code=403, detail="Not a member of this workspace")

    # 2. Get Invites
    statement = select(WorkspaceInvite).where(WorkspaceInvite.workspace_id == workspace_id)
    invites = session.exec(statement).all()
    
    workspace = session.get(Workspace, workspace_id)
    
    return [
        InviteRead(
            code=i.code,
            email=i.email,
            workspace_name=workspace.name,
            expires_at=i.expires_at,
            invite_link=f"http://localhost:3000/invite/{i.code}" # TODO: config
        ) for i in invites
    ]

@router.get("/invites/{code}", response_model=InviteRead)
def get_invite(
    code: str,
    session: Session = Depends(get_session)
):
    invite = session.exec(select(WorkspaceInvite).where(WorkspaceInvite.code == code)).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    
    if invite.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invite expired")

    workspace = session.get(Workspace, invite.workspace_id)
    
    return InviteRead(
        code=invite.code,
        email=invite.email,
        workspace_name=workspace.name,
        expires_at=invite.expires_at,
        invite_link=f"http://localhost:3000/invite/{code}"
    )

@router.delete("/invites/{code}")
def cancel_invite(
    code: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # 1. Get Invite
    invite = session.exec(select(WorkspaceInvite).where(WorkspaceInvite.code == code)).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
        
    # 2. Check permission (Must be OWNER or EDITOR of the workspace)
    statement = select(WorkspaceMember).where(
        WorkspaceMember.workspace_id == invite.workspace_id,
        WorkspaceMember.user_id == current_user.id
    )
    requester = session.exec(statement).first()
    if not requester or requester.role not in [WorkspaceRole.OWNER, WorkspaceRole.EDITOR]:
         raise HTTPException(status_code=403, detail="Not enough permissions")
         
    session.delete(invite)
    session.commit()
    return {"ok": True}

@router.post("/invites/{code}/accept")
def accept_invite(
    code: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # 1. Validate Invite
    invite = session.exec(select(WorkspaceInvite).where(WorkspaceInvite.code == code)).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    
    if invite.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invite expired")
    
    # 2. Check if already member
    existing_member = session.exec(select(WorkspaceMember).where(
        WorkspaceMember.workspace_id == invite.workspace_id,
        WorkspaceMember.user_id == current_user.id
    )).first()

    if existing_member:
        return {"message": "Already a member"}

    # 3. Add Member
    new_member = WorkspaceMember(
        workspace_id=invite.workspace_id,
        user_id=current_user.id,
        role=invite.role
    )
    session.add(new_member)
    
    # 4. Delete Invite (One-time use)
    session.delete(invite)
    
    session.commit()
    return {"message": "Joined workspace successfully", "workspace_id": invite.workspace_id}
