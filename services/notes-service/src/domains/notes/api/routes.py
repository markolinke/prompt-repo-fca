# In src/domains/notes/api/routes.py
from uuid import uuid4
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status
from src.domains.notes.api.schemas import (
    NoteRequestSchema,
    NoteResponseSchema
)
from src.domains.notes.entities.note import Note
from src.domains.notes.services.notes_service import NotesService


def create_notes_router(service: NotesService) -> APIRouter:
    """Create and configure the notes router."""
    router = APIRouter(prefix="/notes", tags=["notes"])
    
    @router.get("", response_model=list[NoteResponseSchema])
    async def get_notes():
        """Get all notes."""
        notes = await service.get_notes()
        # Pydantic models serialize automatically, but explicit is clearer
        return [note.model_dump() for note in notes]
    
    @router.get("/search", response_model=list[NoteResponseSchema])
    async def search_notes(query: str):
        """Search notes by query string."""
        notes = await service.search_notes(query)
        return [note.model_dump() for note in notes]
    
    @router.get("/{note_id}", response_model=NoteResponseSchema)
    async def get_note_by_id(note_id: str):
        """Get a note by ID."""
        try:
            note = await service.get_note_by_id(note_id)
            return note.model_dump()
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e)
            )
    
    @router.post("", response_model=NoteResponseSchema, status_code=status.HTTP_201_CREATED)
    async def create_note(schema: NoteRequestSchema):
        """Create a new note."""
        # Use the class method - cleaner!
        note = Note.from_request_schema(schema)
        
        try:
            note.validate_entity()  # Domain validation
            await service.create_note(note)
            return note.model_dump()
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
    
    @router.put("/{note_id}", response_model=NoteResponseSchema)
    async def update_note(note_id: str, schema: NoteRequestSchema):
        """Update an existing note."""
        # Verify note exists
        try:
            existing_note = await service.get_note_by_id(note_id)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e)
            )
        
        # Create updated note using schema, preserving ID from path
        updated_note = Note.from_request_schema(schema, id=note_id)
        
        try:
            updated_note.validate_entity()
            await service.update_note(updated_note)
            return updated_note.model_dump()
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
    
    @router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
    async def delete_note(note_id: str):
        """Delete a note by ID."""
        try:
            await service.delete_note(note_id)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e)
            )
    
    return router