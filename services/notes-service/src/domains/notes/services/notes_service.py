from src.domains.notes.entities.note import Note
from src.domains.notes.repositories.notes_repository_port import NotesRepositoryPort


class NotesService:
    """Service layer for notes business logic."""
    
    def __init__(self, repository: NotesRepositoryPort):
        self.repository = repository
    
    async def get_notes(self) -> list[Note]:
        """Retrieve all notes."""
        return await self.repository.get_notes()
    
    async def get_note_by_id(self, id: str) -> Note:
        """Retrieve a note by ID."""
        return await self.repository.get_note_by_id(id)
    
    async def create_note(self, note: Note) -> None:
        """Create a new note with validation."""
        note.validate_entity()
        await self.repository.create_note(note)
    
    async def update_note(self, note: Note) -> None:
        """Update an existing note with validation."""
        note.validate_entity()
        await self.repository.update_note(note)
    
    async def delete_note(self, id: str) -> None:
        """Delete a note by ID."""
        await self.repository.delete_note(id)
    
    async def search_notes(self, query: str) -> list[Note]:
        """Search notes by query string."""
        return await self.repository.search_notes(query)
