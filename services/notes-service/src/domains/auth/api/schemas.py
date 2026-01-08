from pydantic import BaseModel, EmailStr


class UserResponseSchema(BaseModel):
    """Schema for user API responses."""
    id: str
    email: str
    name: str


class LoginRequestSchema(BaseModel):
    """Schema for login request."""
    email: EmailStr
    password: str


class RefreshTokenRequestSchema(BaseModel):
    """Schema for refresh token request."""
    refresh_token: str


class TokenResponseSchema(BaseModel):
    """Schema for token response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

