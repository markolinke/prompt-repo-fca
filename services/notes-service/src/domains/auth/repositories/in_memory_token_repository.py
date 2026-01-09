from src.domains.auth.repositories.token_repository_port import TokenRepositoryPort


class InMemoryTokenRepository:
    """In-memory implementation of TokenRepositoryPort for development/testing."""
    
    def __init__(self):
        self._refresh_tokens: dict[str, str] = {}
    
    async def store_refresh_token(self, user_id: str, refresh_token: str) -> None:
        """Store a refresh token for a user."""
        self._refresh_tokens[user_id] = refresh_token
    
    async def get_refresh_token(self, user_id: str) -> str | None:
        """Retrieve the refresh token for a user."""
        return self._refresh_tokens.get(user_id)
    
    async def revoke_refresh_token(self, user_id: str) -> None:
        """Revoke (remove) the refresh token for a user."""
        if user_id in self._refresh_tokens:
            del self._refresh_tokens[user_id]
    
    async def validate_refresh_token(self, user_id: str, refresh_token: str) -> bool:
        """Validate that a refresh token matches the stored token for a user."""
        stored_token = self._refresh_tokens.get(user_id)
        if not stored_token:
            return False
        return stored_token == refresh_token

