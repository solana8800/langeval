from typing import List, Optional
import uuid
from math import ceil
from sqlmodel import Session, func, select
from app.repositories.model_llm import ModelRepository
from app.models.domain import ModelRef, ModelUpdate, ModelCreate, Page
from app.core.security import encrypt_value

class ModelService:
    def __init__(self, session: Session, workspace_id: uuid.UUID):
        self.repository = ModelRepository(session)
        self.session = session
        self.workspace_id = workspace_id

    def create_model(self, model_in: ModelCreate) -> ModelRef:
        # Encrypt API Key
        # print(f"DEBUG: creating model with: {model_in}")
        data = model_in.dict(exclude={"api_key"})
        enc_key = encrypt_value(model_in.api_key) if model_in.api_key else None
        
        model_db = ModelRef(
            **data, 
            api_key_encrypted=enc_key,
            workspace_id=self.workspace_id
        )
        return self.repository.create(model_db)

    def get_model(self, model_id: str) -> Optional[ModelRef]:
        model = self.repository.get(model_id)
        if model and model.workspace_id == self.workspace_id:
            return model
        return None

    def get_models(self, page: int = 1, page_size: int = 10) -> Page[ModelRef]:
        offset = (page - 1) * page_size
        
        # Filter items by workspace
        statement = select(ModelRef)\
            .where(ModelRef.workspace_id == self.workspace_id)\
            .offset(offset).limit(page_size)
        items = self.session.exec(statement).all()
        
        # Count total for workspace
        count_stmt = select(func.count())\
            .select_from(ModelRef)\
            .where(ModelRef.workspace_id == self.workspace_id)
        total = self.session.exec(count_stmt).one()
        
        pages = ceil(total / page_size) if page_size > 0 else 0
        
        return Page(
            items=items,
            total=total,
            page=page,
            size=page_size,
            pages=pages
        )

    def update_model(self, model_id: str, model_update: ModelUpdate) -> Optional[ModelRef]:
        db_model = self.get_model(model_id)
        if not db_model:
            return None
            
        update_data = model_update.dict(exclude_unset=True)
        
        # Handle API Key Rotation
        if "api_key" in update_data:
             raw_key = update_data.pop("api_key")
             if raw_key:
                 update_data["api_key_encrypted"] = encrypt_value(raw_key)
        
        return self.repository.update(db_obj=db_model, obj_in=update_data)

    def delete_model(self, model_id: str) -> bool:
        db_model = self.get_model(model_id)
        if not db_model:
            return False
        self.repository.remove(id=model_id)
        return True
