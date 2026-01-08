from typing import Protocol
from src.domains.auth.entities.user import User


class UserRepositoryPort(Protocol):
    """Port (interface) for user repository operations."""
    
    async def get_by_email(self, email: str) -> User | None:
        """
        Retrieve a user by email address.
        
        Args:
            email: User email address
            
        Returns:
            User if found, None otherwise
        """
        ...
    
    async def get_by_id(self, user_id: str) -> User | None:
        """
        Retrieve a user by ID.
        
        Args:
            user_id: User identifier
            
        Returns:
            User if found, None otherwise
        """
        ...
    
    async def create_user(self, user: User) -> None:
        """
        Create a new user.
        
        Args:
            user: User entity to create
        """
        ...

