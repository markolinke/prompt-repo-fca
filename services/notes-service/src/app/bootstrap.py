from src.domains.notes.repositories.in_memory_notes_repository import InMemoryNotesRepository
from src.domains.notes.services.notes_service import NotesService
from src.domains.notes.api.routes import create_notes_router
from src.domains.auth.providers.mock_auth_provider import MockAuthProvider
from src.domains.auth.services.authentication_service import AuthenticationService
from src.domains.auth.api.routes import create_auth_router


def bootstrap_dependencies():
    """Bootstrap and wire dependencies following Clean Architecture."""
    # Notes domain dependencies
    notes_repository = InMemoryNotesRepository()
    notes_service = NotesService(notes_repository)
    notes_router = create_notes_router(notes_service)
    
    # Auth domain dependencies
    auth_provider = MockAuthProvider()
    auth_service = AuthenticationService(auth_provider)
    auth_router = create_auth_router(auth_service)
    
    return {
        'notes_repository': notes_repository,
        'notes_service': notes_service,
        'notes_router': notes_router,
        'auth_provider': auth_provider,
        'auth_service': auth_service,
        'auth_router': auth_router
    }