import pytest
from src.domains.notes.entities.note import Note
from src.domains.notes.repositories.in_memory_notes_repository import InMemoryNotesRepository
from src.domains.notes.services.notes_service import NotesService
from datetime import datetime, timezone


@pytest.fixture
def repository():
    return InMemoryNotesRepository()


@pytest.fixture
def service(repository):
    return NotesService(repository)


@pytest.mark.asyncio
async def test_get_notes(service):
    notes = await service.get_notes()
    assert len(notes) > 0
    assert all(isinstance(note, Note) for note in notes)


@pytest.mark.asyncio
async def test_create_note(service):
    new_note = Note(
        id="test-123",
        title="Test Note",
        content="Test content",
        last_modified_utc=datetime.now(timezone.utc),
        category="test",
        tags=["pytest"]
    )
    await service.create_note(new_note)
    
    retrieved = await service.get_note_by_id("test-123")
    assert retrieved.title == "Test Note"