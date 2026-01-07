from abc import ABC, abstractmethod
from typing import Protocol
from src.domains.notes.entities.note import Note


class NotesRepositoryPort(Protocol):
    """Port (interface) for notes repository operations."""
    
    async def get_notes(self) -> list[Note]:
        """Retrieve all notes."""
        ...
    
    async def get_note_by_id(self, id: str) -> Note:
        """Retrieve a note by ID."""
        ...
    
    async def create_note(self, note: Note) -> None:
        """Create a new note."""
        ...
    
    async def update_note(self, note: Note) -> None:
        """Update an existing note."""
        ...
    
    async def delete_note(self, id: str) -> None:
        """Delete a note by ID."""
        ...
    
    async def search_notes(self, query: str) -> list[Note]:
        """Search notes by query string."""
        ...
