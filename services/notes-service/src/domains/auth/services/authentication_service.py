from src.domains.auth.entities.user import User
from src.domains.auth.providers.auth_provider_port import AuthProviderPort


class AuthenticationService:
    """Service layer for authentication business logic."""
    
    def __init__(self, auth_provider: AuthProviderPort):
        self.auth_provider = auth_provider
    
    async def get_current_user(self, token: str) -> User | None:
        """
        Get current authenticated user from token.
        
        Args:
            token: Authentication token
            
        Returns:
            User if authenticated, None otherwise
        """
        return await self.auth_provider.authenticate(token)

