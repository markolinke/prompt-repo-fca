# In src/domains/notes/entities/note.py
from uuid import uuid4
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field
from src.common.errors import ValidationError


class Note(BaseModel):
    """Domain entity representing a Note using Pydantic for seamless serialization."""
    
    id: str = Field(..., min_length=1)
    title: str = Field(..., min_length=1)
    content: str = Field(..., min_length=1)
    last_modified_utc: datetime
    category: Optional[str] = None
    tags: list[str] = Field(default_factory=list)
    
    def validate_entity(self) -> None:
        errors: list[str] = []
        
        if not self.id.strip():
            errors.append('ID is required')
        if not self.title.strip():
            errors.append('Title is required')
        if not self.content.strip():
            errors.append('Content is required')
        
        if errors:
            raise ValidationError(
                f"Validation failed: {'; '.join(errors)}",
                errors
            )
    
    @classmethod
    def from_request_schema(
        cls, 
        schema: 'NoteRequestSchema', 
        id: str | None = None
    ) -> 'Note':
        return cls(
            id=id or str(uuid4()),
            title=schema.title,
            content=schema.content,
            last_modified_utc=datetime.now(timezone.utc),
            category=schema.category,
            tags=schema.tags
        )
    
    @classmethod
    def from_dict(cls, data: dict) -> 'Note':
        return cls.model_validate(data)
    
    def to_response_schema(self) -> dict:
        return self.model_dump()
    
    class Config:
        frozen = False  # Allow updates for domain operations