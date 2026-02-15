from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from typing import Annotated, Optional
from pydantic import BaseModel
from uuid import UUID

from models.user import UserRole
from core.security import verify_token, UserContext

class UserResponse(BaseModel):
    id: UUID
    email: str
    role: UserRole
    avatar_url: Optional[str] = None
    
app = FastAPI(title="identity-service")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token") # For Swagger UI

async def get_current_user_token(token: Annotated[str, Depends(oauth2_scheme)]):
    try:
        user_ctx = await verify_token(token)
        return user_ctx
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "identity-service"}

from sqlalchemy.orm import Session
from core.database import get_db, engine
from models.user import User, Base

# Create Tables if not exist (Simpler than migration for now)
Base.metadata.create_all(bind=engine)

@app.get("/me", response_model=UserResponse)
async def read_users_me(
    user_ctx: Annotated[UserContext, Depends(get_current_user_token)],
    db: Session = Depends(get_db)
):
    """
    Lấy thông tin profile của user hiện tại.
    Nếu user chưa tồn tại trong DB -> Tự động tạo mới (Auto-provisioning).
    """
    
    # Check if user exists
    db_user = db.query(User).filter(User.entra_id == user_ctx.oid).first()
    
    if not db_user:
        # Auto Provisioning
        new_user = User(
            email=user_ctx.email, 
            entra_id=user_ctx.oid, 
            role=UserRole.STAKEHOLDER,
            avatar_url=None
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user
        
    return db_user
