from typing import Optional
import uuid
from fastapi import Header, HTTPException

async def get_current_workspace(
    x_workspace_id: Optional[str] = Header(None, alias="X-Workspace-ID")
) -> uuid.UUID:
    if not x_workspace_id:
        raise HTTPException(status_code=400, detail="X-Workspace-ID header is required")
    try:
        return uuid.UUID(x_workspace_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid X-Workspace-ID header format")

async def get_current_workspace_or_none(
    x_workspace_id: Optional[str] = Header(None, alias="X-Workspace-ID")
) -> Optional[uuid.UUID]:
    if not x_workspace_id:
        return None
    try:
        return uuid.UUID(x_workspace_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid X-Workspace-ID header format")
