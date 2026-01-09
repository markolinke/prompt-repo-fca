from fastapi import APIRouter, Depends, HTTPException, status
from src.domains.auth.api.schemas import (
    UserResponseSchema,
    LoginRequestSchema,
    RefreshTokenRequestSchema,
    TokenResponseSchema
)
from src.domains.auth.entities.user import User
from src.domains.auth.middleware.auth_middleware import create_get_current_user
from src.domains.auth.services.authentication_service import AuthenticationService


def create_auth_router(auth_service: AuthenticationService) -> APIRouter:
    """Create and configure the auth router."""
    router = APIRouter(prefix="/auth", tags=["auth"])
    
    # Create the get_current_user dependency with injected service
    get_current_user = create_get_current_user(auth_service)
    
    @router.post("/login", response_model=TokenResponseSchema)
    async def login(login_data: LoginRequestSchema):
        """
        Authenticate user and return access and refresh tokens.
        
        Args:
            login_data: Login credentials (email and password)
            
        Returns:
            Token response with access and refresh tokens
            
        Raises:
            HTTPException: 401 if credentials are invalid
        """
        try:
            access_token, refresh_token = await auth_service.login(
                email=login_data.email,
                password=login_data.password
            )
            return TokenResponseSchema(
                access_token=access_token,
                refresh_token=refresh_token,
                token_type="bearer"
            )
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=str(e)
            )
    
    @router.post("/refresh", response_model=TokenResponseSchema)
    async def refresh_token(refresh_data: RefreshTokenRequestSchema):
        """
        Refresh access token using refresh token.
        
        Args:
            refresh_data: Refresh token request data
            
        Returns:
            Token response with new access and refresh tokens
            
        Raises:
            HTTPException: 401 if refresh token is invalid
        """
        try:
            access_token, refresh_token = await auth_service.refresh_token(
                refresh_data.refresh_token
            )
            return TokenResponseSchema(
                access_token=access_token,
                refresh_token=refresh_token,
                token_type="bearer"
            )
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=str(e)
            )
    
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

