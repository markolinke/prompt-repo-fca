from typing import Protocol
from src.domains.auth.entities.user import User


class AuthProviderPort(Protocol):
    """Port (interface) for authentication provider operations."""
    
    async def authenticate(self, token: str) -> User | None:
        """
        Validate token and return user, or None if invalid.
        
        Args:
            token: Authentication token to validate
            
        Returns:
            User if token is valid, None otherwise
        """
        ...

