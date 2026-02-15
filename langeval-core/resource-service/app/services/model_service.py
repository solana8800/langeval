from typing import List, Optional
from math import ceil
from sqlmodel import Session, func, select
from app.repositories.model_llm import ModelRepository
from app.models.domain import ModelRef, ModelUpdate, ModelCreate, Page
from app.core.security import encrypt_value

class ModelService:
    def __init__(self, session: Session):
        self.repository = ModelRepository(session)
        self.session = session

    def create_model(self, model_in: ModelCreate) -> ModelRef:
        # Encrypt API Key
        print(f"DEBUG: creating model with: {model_in}")
        data = model_in.dict(exclude={"api_key"})
        enc_key = encrypt_value(model_in.api_key) if model_in.api_key else None
        print(f"DEBUG: encrypted_key: {enc_key}")
        
        model_db = ModelRef(**data, api_key_encrypted=enc_key)
        return self.repository.create(model_db)

    def get_model(self, model_id: str) -> Optional[ModelRef]:
        return self.repository.get(model_id)

    def get_models(self, page: int = 1, page_size: int = 10) -> Page[ModelRef]:
        offset = (page - 1) * page_size
        items = self.repository.get_multi(skip=offset, limit=page_size)
        statement = select(func.count()).select_from(ModelRef)
        total = self.session.exec(statement).one()
        pages = ceil(total / page_size) if page_size > 0 else 0
        
        return Page(
            items=items,
            total=total,
            page=page,
            size=page_size,
            pages=pages
        )

    def update_model(self, model_id: str, model_update: ModelUpdate) -> Optional[ModelRef]:
        db_model = self.repository.get(model_id)
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
        model = self.repository.remove(id=model_id)
        return model is not None
