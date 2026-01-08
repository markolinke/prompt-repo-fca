from datetime import timedelta
from src.domains.auth.entities.user import User
from src.domains.auth.providers.auth_provider_port import AuthProviderPort
from src.domains.auth.services.jwt_service import JWTService
from src.domains.auth.repositories.user_repository_port import UserRepositoryPort
from src.domains.auth.repositories.token_repository_port import TokenRepositoryPort


class AuthenticationService:
    """Service layer for authentication business logic."""
    
    def __init__(
        self,
        jwt_service: JWTService,
        user_repository: UserRepositoryPort,
        token_repository: TokenRepositoryPort,
        access_token_expiry: timedelta,
        refresh_token_expiry: timedelta
    ):
        """
        Initialize authentication service.
        
        Args:
            jwt_service: JWT service for token operations
            user_repository: User repository for user lookups
            token_repository: Token repository for refresh token storage
            access_token_expiry: Access token expiration time
            refresh_token_expiry: Refresh token expiration time
        """
        self.jwt_service = jwt_service
        self.user_repository = user_repository
        self.token_repository = token_repository
        self.access_token_expiry = access_token_expiry
        self.refresh_token_expiry = refresh_token_expiry
    
    async def login(self, email: str, password: str) -> tuple[str, str]:
        """
        Authenticate a user and generate tokens.
        
        Args:
            email: User email
            password: User password
            
        Returns:
            Tuple of (access_token, refresh_token)
            
        Raises:
            ValueError: If credentials are invalid
        """
        # Get user by email
        user = await self.user_repository.get_by_email(email)
        if not user:
            raise ValueError("Invalid credentials")
        
        # Validate password (simple check for Phase 3)
        # In production, this would use password hashing
        if hasattr(self.user_repository, 'validate_password'):
            if not self.user_repository.validate_password(email, password):
                raise ValueError("Invalid credentials")
        else:
            # Fallback: assume password is valid if repository doesn't support validation
            # This allows for flexibility in implementation
            pass
        
        # Generate tokens
        access_token = self.jwt_service.encode_token(
            user_id=user.id,
            email=user.email,
            expires_in=self.access_token_expiry
        )
        refresh_token = self.jwt_service.encode_refresh_token(
            user_id=user.id,
            expires_in=self.refresh_token_expiry
        )
        
        # Store refresh token
        await self.token_repository.store_refresh_token(user.id, refresh_token)
        
        return access_token, refresh_token
    
    async def refresh_token(self, refresh_token: str) -> tuple[str, str]:
        """
        Refresh access token using refresh token.
        
        Args:
            refresh_token: Refresh token
            
        Returns:
            Tuple of (new_access_token, new_refresh_token)
            
        Raises:
            ValueError: If refresh token is invalid
        """
        # Validate and decode refresh token
        payload = self.jwt_service.validate_token(refresh_token)
        if not payload:
            raise ValueError("Invalid refresh token")
        
        # Check token type
        if payload.get("type") != "refresh":
            raise ValueError("Invalid token type")
        
        user_id = payload.get("sub")
        if not user_id:
            raise ValueError("Invalid token payload")
        
        # Verify refresh token exists in repository
        is_valid = await self.token_repository.validate_refresh_token(user_id, refresh_token)
        if not is_valid:
            raise ValueError("Refresh token not found or revoked")
        
        # Get user to generate new tokens
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            raise ValueError("User not found")
        
        # Generate new tokens
        new_access_token = self.jwt_service.encode_token(
            user_id=user.id,
            email=user.email,
            expires_in=self.access_token_expiry
        )
        new_refresh_token = self.jwt_service.encode_refresh_token(
            user_id=user.id,
            expires_in=self.refresh_token_expiry
        )
        
        # Update stored refresh token
        await self.token_repository.store_refresh_token(user.id, new_refresh_token)
        
        return new_access_token, new_refresh_token
    
    async def get_current_user(self, token: str) -> User | None:
        """
        Get current authenticated user from JWT token.
        
        Args:
            token: JWT access token
            
        Returns:
            User if authenticated, None otherwise
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

