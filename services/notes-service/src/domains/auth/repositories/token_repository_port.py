from typing import Protocol


class TokenRepositoryPort(Protocol):
    """Port (interface) for refresh token repository operations."""
    
    async def store_refresh_token(self, user_id: str, refresh_token: str) -> None:
        """
        Store a refresh token for a user.
        
        Args:
            user_id: User identifier
            refresh_token: Refresh token to store
        """
        ...
    
    async def get_refresh_token(self, user_id: str) -> str | None:
        """
        Retrieve the refresh token for a user.
        
        Args:
            user_id: User identifier
            
        Returns:
            Refresh token if found, None otherwise
        """
        ...
    
    async def revoke_refresh_token(self, user_id: str) -> None:
        """
        Revoke (remove) the refresh token for a user.
        
        Args:
            user_id: User identifier
        """
        ...
    
    async def validate_refresh_token(self, user_id: str, refresh_token: str) -> bool:
        """
        Validate that a refresh token matches the stored token for a user.
        
        Args:
            user_id: User identifier
            refresh_token: Refresh token to validate
            
        Returns:
            True if token matches, False otherwise
        """
        ...

