from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class NoteRequestSchema(BaseModel):
    """Unified schema for creating and updating notes (matching frontend)."""
    id: Optional[str] = None  # Optional for create, required for update
    title: str = Field(..., min_length=1)
    content: str = Field(..., min_length=1)
    category: Optional[str] = None
    tags: list[str] = Field(default_factory=list)


class NoteResponseSchema(BaseModel):
    """Schema for note API responses."""
    id: str
    title: str
    content: str
    last_modified_utc: datetime
    category: Optional[str]
    tags: list[str]