from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from src.domains.auth.entities.user import User
from src.domains.auth.services.authentication_service import AuthenticationService


security = HTTPBearer(auto_error=False)


def create_get_current_user(auth_service: AuthenticationService):
    """
    Factory function to create get_current_user dependency with injected service.
    
    This follows FastAPI's dependency injection pattern and allows the service
    to be injected during bootstrap.
    
    Args:
        auth_service: Authentication service instance
        
    Returns:
        Dependency function for FastAPI
    """
    async def get_current_user(
        credentials: HTTPAuthorizationCredentials | None = Depends(security)
    ) -> User:
        """
        FastAPI dependency to get the current authenticated user.
        
        Validates JWT token and returns authenticated user.
        
        Args:
            credentials: HTTP Bearer token credentials (required)
            
        Returns:
            Authenticated User
            
        Raises:
            HTTPException: 401 if authentication fails
        """
        # Require Authorization header with Bearer token
        if not credentials:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        token = credentials.credentials
        user = await auth_service.get_current_user(token)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return user
    
    return get_current_user

