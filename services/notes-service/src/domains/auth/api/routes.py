from fastapi import APIRouter, Depends
from src.domains.auth.api.schemas import UserResponseSchema
from src.domains.auth.entities.user import User
from src.domains.auth.middleware.auth_middleware import create_get_current_user
from src.domains.auth.services.authentication_service import AuthenticationService


def create_auth_router(auth_service: AuthenticationService) -> APIRouter:
    """Create and configure the auth router."""
    router = APIRouter(prefix="/auth", tags=["auth"])
    
    # Create the get_current_user dependency with injected service
    get_current_user = create_get_current_user(auth_service)
    
    @router.get("/me", response_model=UserResponseSchema)
    async def get_current_user_info(
        current_user: User = Depends(get_current_user)
    ):
        """Get current authenticated user information."""
        return UserResponseSchema(
            id=current_user.id,
            email=current_user.email,
            name=current_user.name
        )
    
    return router

