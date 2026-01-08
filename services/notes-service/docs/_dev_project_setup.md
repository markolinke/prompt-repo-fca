## Step-by-Step FastAPI Project Setup Guide

### Step 1: Create Project Structure

Create this structure in `services/notes-service/`:

```
notes-service/
├── src/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app entry point
│   │   └── bootstrap.py         # Dependency injection / wiring
│   ├── common/
│   │   ├── __init__.py
│   │   └── errors.py            # DomainError equivalent
│   └── domains/
│       └── notes/
│           ├── __init__.py
│           ├── entities/
│           │   ├── __init__.py
│           │   └── note.py      # Note entity
│           ├── services/
│           │   ├── __init__.py
│           │   └── notes_service.py
│           ├── repositories/
│           │   ├── __init__.py
│           │   ├── notes_repository_port.py  # Abstract base class
│           │   ├── in_memory_notes_repository.py  # Mock implementation
│           │   └── sqlite_notes_repository.py  # SQLite implementation (future)
│           └── api/
│               ├── __init__.py
│               ├── routes.py    # FastAPI routes
│               └── schemas.py   # Pydantic models for API
├── tests/
│   ├── __init__.py
│   └── domains/
│       └── notes/
│           ├── __init__.py
│           └── test_notes_service.py
├── requirements.txt
├── pyproject.toml              # Optional: modern Python project config
└── README.md
```

### Step 2: Create Requirements File

Create `services/notes-service/requirements.txt`:

```txt
fastapi==0.115.0
uvicorn[standard]==0.32.0
pydantic==2.9.0
pydantic-settings==2.5.0
pytest==8.3.3
pytest-asyncio==0.24.0
httpx==0.27.2
```

### Step 3: Install Dependencies

```bash
cd services/notes-service
source env/bin/activate  # On macOS/Linux
# OR: env\Scripts\activate  # On Windows

pip install --upgrade pip
pip install -r requirements.txt
```

### Step 4: Create Common Error Handling

Create `src/common/__init__.py` (empty) and `src/common/errors.py`:

```python
class DomainError(Exception):
    """Base exception for domain errors."""
    pass


class ValidationError(DomainError):
    """Raised when domain validation fails."""
    def __init__(self, message: str, errors: list[str] | None = None):
        super().__init__(message)
        self.message = message
        self.errors = errors or []
```

### Step 5: Create Note Entity

Create `src/domains/notes/entities/__init__.py` (empty) and `src/domains/notes/entities/note.py`:

```python
from datetime import datetime
from typing import Optional
from src.common.errors import ValidationError


class Note:
    """Domain entity representing a Note."""
    
    def __init__(
        self,
        id: str,
        title: str,
        content: str,
        last_modified_utc: datetime,
        category: Optional[str],
        tags: list[str]
    ):
        self.id = id
        self.title = title
        self.content = content
        self.last_modified_utc = last_modified_utc
        self.category = category
        self.tags = tuple(tags)  # Immutable tuple like frontend readonly
    
    def validate(self) -> None:
        """Validates note properties according to domain rules.
        
        Raises:
            ValidationError: if validation fails
        """
        errors: list[str] = []
        
        if not self.id or not self.id.strip():
            errors.append('ID is required')
        if not self.title or not self.title.strip():
            errors.append('Title is required')
        if not self.content or not self.content.strip():
            errors.append('Content is required')
        
        if errors:
            raise ValidationError(
                f"Validation failed: {'; '.join(errors)}",
                errors
            )
    
    def to_dict(self) -> dict:
        """Convert Note to dictionary for serialization."""
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'last_modified_utc': self.last_modified_utc.isoformat(),
            'category': self.category,
            'tags': list(self.tags)
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> 'Note':
        """Create Note from dictionary (deserialization)."""
        last_modified = data['last_modified_utc']
        if isinstance(last_modified, str):
            last_modified = datetime.fromisoformat(last_modified.replace('Z', '+00:00'))
        
        return cls(
            id=data['id'],
            title=data['title'],
            content=data['content'],
            last_modified_utc=last_modified,
            category=data.get('category'),
            tags=data.get('tags', [])
        )
```

### Step 6: Create Repository Port (Interface)

Create `src/domains/notes/repositories/notes_repository_port.py`:

```python
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
```

### Step 7: Create In-Memory Repository (Mock Implementation)

Create `src/domains/notes/repositories/in_memory_notes_repository.py`:

```python
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
```

### Step 8: Create Notes Service

Create `src/domains/notes/services/notes_service.py`:

```python
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
        note.validate()
        await self.repository.create_note(note)
    
    async def update_note(self, note: Note) -> None:
        """Update an existing note with validation."""
        note.validate()
        await self.repository.update_note(note)
    
    async def delete_note(self, id: str) -> None:
        """Delete a note by ID."""
        await self.repository.delete_note(id)
    
    async def search_notes(self, query: str) -> list[Note]:
        """Search notes by query string."""
        return await self.repository.search_notes(query)
```

### Step 9: Create API Schemas (Pydantic Models)

Create `src/domains/notes/api/schemas.py`:

```python
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class NoteCreateSchema(BaseModel):
    """Schema for creating a note."""
    title: str = Field(..., min_length=1)
    content: str = Field(..., min_length=1)
    category: Optional[str] = None
    tags: list[str] = Field(default_factory=list)


class NoteUpdateSchema(BaseModel):
    """Schema for updating a note."""
    title: Optional[str] = Field(None, min_length=1)
    content: Optional[str] = Field(None, min_length=1)
    category: Optional[str] = None
    tags: Optional[list[str]] = None


class NoteResponseSchema(BaseModel):
    """Schema for note API responses."""
    id: str
    title: str
    content: str
    last_modified_utc: datetime
    category: Optional[str]
    tags: list[str]
    
    class Config:
        from_attributes = True
```

### Step 10: Create API Routes

Create `src/domains/notes/api/routes.py`:

```python
from uuid import uuid4
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Depends
from src.domains.notes.api.schemas import (
    NoteCreateSchema,
    NoteUpdateSchema,
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
        return [note.to_dict() for note in notes]
    
    @router.get("/{note_id}", response_model=NoteResponseSchema)
    async def get_note_by_id(note_id: str):
        """Get a note by ID."""
        try:
            note = await service.get_note_by_id(note_id)
            return note.to_dict()
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e)
            )
    
    @router.post("", response_model=NoteResponseSchema, status_code=status.HTTP_201_CREATED)
    async def create_note(schema: NoteCreateSchema):
        """Create a new note."""
        note = Note(
            id=str(uuid4()),
            title=schema.title,
            content=schema.content,
            last_modified_utc=datetime.now(timezone.utc),
            category=schema.category,
            tags=schema.tags
        )
        try:
            await service.create_note(note)
            return note.to_dict()
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
    
    @router.put("/{note_id}", response_model=NoteResponseSchema)
    async def update_note(note_id: str, schema: NoteUpdateSchema):
        """Update an existing note."""
        # Get existing note
        try:
            existing_note = await service.get_note_by_id(note_id)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e)
            )
        
        # Merge updates
        updated_note = Note(
            id=note_id,
            title=schema.title if schema.title is not None else existing_note.title,
            content=schema.content if schema.content is not None else existing_note.content,
            last_modified_utc=datetime.now(timezone.utc),
            category=schema.category if schema.category is not None else existing_note.category,
            tags=schema.tags if schema.tags is not None else list(existing_note.tags)
        )
        
        try:
            await service.update_note(updated_note)
            return updated_note.to_dict()
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
    
    @router.get("/search", response_model=list[NoteResponseSchema])
    async def search_notes(query: str):
        """Search notes by query string."""
        notes = await service.search_notes(query)
        return [note.to_dict() for note in notes]
    
    return router
```

### Step 11: Create Bootstrap (Dependency Injection)

Create `src/app/bootstrap.py`:

```python
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
```

### Step 12: Create FastAPI Main Application

Create `src/app/main.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.app.bootstrap import bootstrap_dependencies


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    app = FastAPI(
        title="Notes API",
        description="Notes service following Clean Architecture",
        version="1.0.0"
    )
    
    # CORS middleware (adjust for production)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173"],  # Vue dev server
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Bootstrap dependencies
    dependencies = bootstrap_dependencies()
    
    # Register routers
    app.include_router(dependencies['notes_router'])
    
    @app.get("/health")
    async def health_check():
        """Health check endpoint."""
        return {"status": "ok"}
    
    return app


# Create app instance
app = create_app()
```

### Step 13: Create Entry Point Scripts

Create `run.py` in the root of `notes-service/`:

```python
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "src.app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True  # Auto-reload on code changes
    )
```

### Step 14: Test the Setup

Create a simple test file `tests/domains/notes/test_notes_service.py`:

```python
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
```

### Step 15: Run the Service

```bash
# Activate virtual environment
source env/bin/activate

# Run the server
python run.py

# OR using uvicorn directly
uvicorn src.app.main:app --reload --host 0.0.0.0 --port 8000
```

### Step 16: Verify It Works

1. Health check: `http://localhost:8000/health`
2. API docs: `http://localhost:8000/docs` (Swagger UI)
3. Alternative docs: `http://localhost:8000/redoc`
4. Get notes: `http://localhost:8000/notes`

### Step 17: (Optional) Create pyproject.toml

Create `pyproject.toml` for modern Python project management:

```toml
[build-system]
requires = ["setuptools>=61.0", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "notes-service"
version = "0.1.0"
description = "Notes service following Clean Architecture"
requires-python = ">=3.12"
dependencies = [
    "fastapi==0.115.0",
    "uvicorn[standard]==0.32.0",
    "pydantic==2.9.0",
    "pydantic-settings==2.5.0",
]

[project.optional-dependencies]
dev = [
    "pytest==8.3.3",
    "pytest-asyncio==0.24.0",
    "httpx==0.27.2",
]

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
```

---

## Summary

This follows Clean Architecture principles:
- Entities: domain models with validation
- Services: business logic layer
- Repositories: data access abstraction (port/adapter)
- API layer: FastAPI routes and schemas
- Bootstrap: dependency injection and wiring

The structure mirrors your frontend patterns, making it familiar for the team. The in-memory repository is a starting point; you can later add SQLite/PostgreSQL implementations following the same port interface.

Next steps:
1. Add database persistence (SQLite or PostgreSQL)
2. Add error handling middleware
3. Add logging
4. Add authentication/authorization
5. Add integration tests
