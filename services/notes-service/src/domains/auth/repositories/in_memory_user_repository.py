from src.domains.auth.entities.user import User
from src.domains.auth.repositories.user_repository_port import UserRepositoryPort


class InMemoryUserRepository:
    """In-memory implementation of UserRepositoryPort for development/testing."""
    
    def __init__(self):
        self._users_by_id: dict[str, User] = {}
        self._users_by_email: dict[str, User] = {}
        # Simple password storage for Phase 3 (mock authentication)
        self._passwords: dict[str, str] = {}
        self._initialize_mock_data()
    
    def _initialize_mock_data(self):
        """Initialize with mock user data for testing."""
        mock_user = User(
            id="user-1",
            email="john.doe@ancorit.com",
            name="Test User"
        )
        self._users_by_id[mock_user.id] = mock_user
        self._users_by_email[mock_user.email] = mock_user
        # For Phase 3, simple password check
        self._passwords[mock_user.email] = "LetMeIn!"
    
    async def get_by_email(self, email: str) -> User | None:
        """Retrieve a user by email address."""
        return self._users_by_email.get(email)
    
    async def get_by_id(self, user_id: str) -> User | None:
        """Retrieve a user by ID."""
        return self._users_by_id.get(user_id)
    
    async def create_user(self, user: User) -> None:
        """Create a new user."""
        if user.id in self._users_by_id:
            raise ValueError(f"User with id {user.id} already exists")
        if user.email in self._users_by_email:
            raise ValueError(f"User with email {user.email} already exists")
        
        self._users_by_id[user.id] = user
        self._users_by_email[user.email] = user
    
    def validate_password(self, email: str, password: str) -> bool:
        """
        Validate a password for a user.
        
        This is a simple implementation for Phase 3.
        In production, this would use password hashing.
        
        Args:
            email: User email
            password: Password to validate
            
        Returns:
            True if password matches, False otherwise
        """
        stored_password = self._passwords.get(email)
        if not stored_password:
            return False
        return stored_password == password

