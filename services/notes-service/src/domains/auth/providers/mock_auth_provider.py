from src.domains.auth.entities.user import User
from src.domains.auth.providers.auth_provider_port import AuthProviderPort


class MockAuthProvider:
    """Mock authentication provider that always authenticates successfully."""
    
    async def authenticate(self, token: str) -> User | None:
        """
        Always returns a mock user (no actual validation).
        
        This is a placeholder implementation for Phase 1.
        In later phases, this will be replaced with real JWT validation.
        """
        # Return a mock user regardless of token
        return User(
            id="mock-user-1",
            email="test@example.com",
            name="Test User"
        )

