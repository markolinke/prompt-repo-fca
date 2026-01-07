from src.domains.notes.repositories.in_memory_notes_repository import InMemoryNotesRepository
from src.domains.notes.services.notes_service import NotesService
from src.domains.notes.api.routes import create_notes_router


def bootstrap_dependencies():
    """Bootstrap and wire dependencies following Clean Architecture."""
    # Repository layer
    repository = InMemoryNotesRepository()
    
    # Service layer
    service = NotesService(repository)
    
    # API layer
    notes_router = create_notes_router(service)
    
    return {
        'repository': repository,
        'service': service,
        'notes_router': notes_router
    }