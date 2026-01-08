from pydantic import BaseModel


class UserResponseSchema(BaseModel):
    """Schema for user API responses."""
    id: str
    email: str
    name: str

