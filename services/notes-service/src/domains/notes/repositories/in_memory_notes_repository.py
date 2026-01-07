from typing import Optional
from src.domains.notes.entities.note import Note
from src.domains.notes.repositories.notes_repository_port import NotesRepositoryPort
from datetime import datetime, timezone


class InMemoryNotesRepository:
    """In-memory implementation of NotesRepositoryPort for development/testing."""
    
    def __init__(self):
        self._notes: dict[str, Note] = {}
        self._initialize_mock_data()
    
    def _initialize_mock_data(self):
        """Initialize with some mock data."""
        mock_notes = [
            Note(
                id='1',
                title='Getting Started with Clean Architecture',
                content='Clean Architecture helps separate concerns...',
                last_modified_utc=datetime.now(timezone.utc),
                category='design/architecture',
                tags=['architecture', 'clean-code']
            ),
            Note(
                id='2',
                title='FastAPI Best Practices',
                content='FastAPI is a modern Python web framework...',
                last_modified_utc=datetime.now(timezone.utc),
                category='backend/frameworks',
                tags=['python', 'fastapi', 'backend']
            )
        ]
        for note in mock_notes:
            self._notes[note.id] = note
    
    async def get_notes(self) -> list[Note]:
        return list(self._notes.values())
    
    async def get_note_by_id(self, id: str) -> Note:
        note = self._notes.get(id)
        if not note:
            raise ValueError(f"Note with id {id} not found")
        return note
    
    async def create_note(self, note: Note) -> None:
        if note.id in self._notes:
            raise ValueError(f"Note with id {note.id} already exists")
        self._notes[note.id] = note
    
    async def update_note(self, note: Note) -> None:
        if note.id not in self._notes:
            raise ValueError(f"Note with id {note.id} not found")
        # Update last_modified_utc
        updated_note = Note(
            id=note.id,
            title=note.title,
            content=note.content,
            last_modified_utc=datetime.now(timezone.utc),
            category=note.category,
            tags=list(note.tags)
        )
        self._notes[note.id] = updated_note
    
    async def delete_note(self, id: str) -> None:
        if id not in self._notes:
            raise ValueError(f"Note with id {id} not found")
        del self._notes[id]
    
    async def search_notes(self, query: str) -> list[Note]:
        query_lower = query.lower()
        return [
            note for note in self._notes.values()
            if query_lower in note.title.lower() 
            or query_lower in note.content.lower()
            or any(query_lower in tag.lower() for tag in note.tags)
        ]