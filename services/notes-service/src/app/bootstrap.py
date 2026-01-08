from datetime import timedelta
from src.domains.notes.repositories.in_memory_notes_repository import InMemoryNotesRepository
from src.domains.notes.services.notes_service import NotesService
from src.domains.notes.api.routes import create_notes_router
from src.common.env.app_config import AppConfig
from src.domains.auth.services.jwt_service import JWTService
from src.domains.auth.repositories.in_memory_user_repository import InMemoryUserRepository
from src.domains.auth.repositories.in_memory_token_repository import InMemoryTokenRepository
from src.domains.auth.providers.jwt_auth_provider import JWTAuthProvider
from src.domains.auth.services.authentication_service import AuthenticationService
from src.domains.auth.api.routes import create_auth_router


def bootstrap_dependencies():
    """Bootstrap and wire dependencies following Clean Architecture."""
    # Notes domain dependencies
    notes_repository = InMemoryNotesRepository()
    notes_service = NotesService(notes_repository)
    notes_router = create_notes_router(notes_service)
    
    # Load configuration
    app_config = AppConfig()
    
    # JWT service
    jwt_service = JWTService(
        secret_key=app_config.secret_key,
        algorithm=app_config.algorithm
    )
    
    # Auth repositories
    user_repository = InMemoryUserRepository()
    token_repository = InMemoryTokenRepository()
    
    # Token expiry times
    access_token_expiry = timedelta(hours=app_config.access_token_expiry_hours)
    refresh_token_expiry = timedelta(days=app_config.refresh_token_expiry_days)
    
    # Auth service
    auth_service = AuthenticationService(
        jwt_service=jwt_service,
        user_repository=user_repository,
        token_repository=token_repository,
        access_token_expiry=access_token_expiry,
        refresh_token_expiry=refresh_token_expiry
    )
    
    # JWT auth provider (for AuthProviderPort compatibility)
    jwt_auth_provider = JWTAuthProvider(
        jwt_service=jwt_service,
        user_repository=user_repository
    )
    
    # Auth router
    auth_router = create_auth_router(auth_service)
    
    return {
        'notes_repository': notes_repository,
        'notes_service': notes_service,
        'notes_router': notes_router,
        'app_config': app_config,
        'jwt_service': jwt_service,
        'user_repository': user_repository,
        'token_repository': token_repository,
        'auth_service': auth_service,
        'jwt_auth_provider': jwt_auth_provider,
        'auth_router': auth_router
    }