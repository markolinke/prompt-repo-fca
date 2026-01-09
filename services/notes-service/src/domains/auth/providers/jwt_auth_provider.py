from src.domains.auth.entities.user import User
from src.domains.auth.providers.auth_provider_port import AuthProviderPort
from src.domains.auth.services.jwt_service import JWTService
from src.domains.auth.repositories.user_repository_port import UserRepositoryPort


class JWTAuthProvider:
    """JWT-based authentication provider implementing AuthProviderPort."""
    
    def __init__(
        self,
        jwt_service: JWTService,
        user_repository: UserRepositoryPort
    ):
        """
        Initialize JWT auth provider.
        
        Args:
            jwt_service: JWT service for token validation
            user_repository: User repository for user lookups
        """
        self.jwt_service = jwt_service
        self.user_repository = user_repository
    
    async def authenticate(self, token: str) -> User | None:
        """
        Validate JWT token and return authenticated user.
        
        Args:
            token: JWT access token
            
        Returns:
            User if token is valid, None otherwise
        """
        # Validate and decode token
        payload = self.jwt_service.validate_token(token)
        if not payload:
            return None
        
        # Check token type
        if payload.get("type") != "access":
            return None
        
        # Extract user ID
        user_id = payload.get("sub")
        if not user_id:
            return None
        
        # Fetch user from repository
        user = await self.user_repository.get_by_id(user_id)
        return user

