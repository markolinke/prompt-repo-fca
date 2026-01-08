from pydantic import BaseModel, Field


class User(BaseModel):
    """Domain entity representing a User."""
    
    id: str = Field(..., min_length=1)
    email: str = Field(..., min_length=1)
    name: str = Field(..., min_length=1)
    
    def validate_entity(self) -> None:
        """Domain-specific validation beyond Pydantic field validation."""
        if not self.id.strip():
            raise ValueError("User ID cannot be empty")
        if not self.name.strip():
            raise ValueError("User name cannot be empty")
    
    class Config:
        frozen = False  # Allow updates for domain operations

