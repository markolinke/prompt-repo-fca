# AI Agent Guidelines for Notes Service

This document provides essential guidance for AI agents working on this Python FastAPI codebase. It complements the detailed documentation in `docs/` and focuses on practical patterns, rules, and common tasks.

## Quick Start: Understanding the Architecture

This service follows **Clean Architecture** principles, matching the patterns used in the frontend application:

- **Domains** (`src/domains/`) are self-contained feature modules
- Each domain has its own: entities, repositories, services, API routes, schemas
- **Common layer** (`src/common/`) provides framework-agnostic infrastructure
- **App layer** (`src/app/`) handles FastAPI app initialization and dependency bootstrapping

**Critical Rule**: Dependencies flow inward: API Routes → Services → Repositories → Infrastructure

### Layer Structure

```
┌─────────────────────────────────────┐
│   API Layer (FastAPI Routes)        │  ← Framework-specific (FastAPI)
├─────────────────────────────────────┤
│   Schemas (Pydantic DTOs)           │  ← Request/Response models
├─────────────────────────────────────┤
│   Service Layer (Business Logic)    │  ← Domain logic (framework-agnostic)
├─────────────────────────────────────┤
│   Repository Port (Protocol)        │  ← Abstraction (Python Protocol)
├─────────────────────────────────────┤
│   Repository Implementation         │  ← Infrastructure (DB, HTTP, Mock)
└─────────────────────────────────────┘
```

## Essential Documentation References

Before making changes, review these files:

1. **[docs/project-setup.md](./docs/project-setup.md)** - Project structure, design decisions, and setup
2. **Root [AGENTS.md](../../AGENTS.md)** - Monorepo-wide Clean Architecture principles

## Critical Rules (DO NOT VIOLATE)

### 1. Dependency Flow Rules

- ✅ **Routes** can only call **Services** (never repositories directly)
- ✅ **Services** depend on **Repository Ports** (Protocols), not implementations
- ✅ **Repositories** implement the Protocol interface
- ✅ **Entities** use Pydantic BaseModel for serialization and validation
- ❌ **NEVER** make database/HTTP calls from routes or services
- ❌ **NEVER** import repository implementations in services (only Protocols)
- ❌ **NEVER** put business logic in routes

### 2. Bootstrap Pattern (MANDATORY)

Every domain **MUST** have its dependencies bootstrapped in `src/app/bootstrap.py`:

```python
# src/app/bootstrap.py
def bootstrap_dependencies():
    """Bootstrap and wire dependencies following Clean Architecture."""
    # Repository layer
    repository = InMemoryNotesRepository()  # or database-backed implementation
    
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

**Dependencies are wired once at startup**, creating a single instance of each layer.

### 3. Entity Pattern (MANDATORY)

All entities **MUST** use Pydantic `BaseModel` and provide conversion methods:

```python
# src/domains/notes/entities/note.py
from pydantic import BaseModel, Field
from datetime import datetime, timezone
from uuid import uuid4

class Note(BaseModel):
    """Domain entity representing a Note."""
    
    id: str = Field(..., min_length=1)
    title: str = Field(..., min_length=1)
    content: str = Field(..., min_length=1)
    last_modified_utc: datetime
    category: Optional[str] = None
    tags: list[str] = Field(default_factory=list)
    
    def validate_entity(self) -> None:
        """Domain-specific validation beyond Pydantic field validation."""
        errors: list[str] = []
        if not self.id.strip():
            errors.append('ID is required')
        if errors:
            raise ValidationError(f"Validation failed: {'; '.join(errors)}", errors)
    
    @classmethod
    def from_request_schema(cls, schema: NoteRequestSchema, id: str | None = None) -> 'Note':
        """Create Note from request schema."""
        return cls(
            id=id or str(uuid4()),
            title=schema.title,
            content=schema.content,
            last_modified_utc=datetime.now(timezone.utc),
            category=schema.category,
            tags=schema.tags
        )
```

**Why Pydantic BaseModel?**
- Seamless MongoDB/BSON serialization
- Built-in validation and type safety
- Automatic FastAPI response serialization
- Use `model_dump()` instead of manual `to_dict()`

### 4. Repository Port Pattern (MANDATORY)

Every repository **MUST** have a Protocol (interface) defined:

```python
# src/domains/notes/repositories/notes_repository_port.py
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
```

**Implementations** must match the Protocol exactly:

```python
# src/domains/notes/repositories/in_memory_notes_repository.py
class InMemoryNotesRepository:
    """In-memory implementation for development/testing."""
    
    async def get_notes(self) -> list[Note]:
        # Implementation
        ...
```

**Why Protocols instead of ABC?**
- Structural typing (duck typing) - no explicit inheritance needed
- More Pythonic and flexible
- Service doesn't need to import implementations

### 5. Service Pattern (MANDATORY)

Services **MUST**:
- Accept repository via constructor (dependency injection)
- Contain business logic, not just pass-through
- Call entity validation methods
- Be framework-agnostic (no FastAPI imports)

```python
# src/domains/notes/services/notes_service.py
class NotesService:
    """Service layer for notes business logic."""
    
    def __init__(self, repository: NotesRepositoryPort):
        self.repository = repository
    
    async def create_note(self, note: Note) -> None:
        """Create a new note with validation."""
        note.validate_entity()  # Domain validation
        await self.repository.create_note(note)
```

### 6. Router Factory Pattern (MANDATORY)

Routes **MUST** be created via factory functions that accept the service:

```python
# src/domains/notes/api/routes.py
def create_notes_router(service: NotesService) -> APIRouter:
    """Create and configure the notes router."""
    router = APIRouter(prefix="/notes", tags=["notes"])
    
    @router.get("", response_model=list[NoteResponseSchema])
    async def get_notes():
        notes = await service.get_notes()
        return [note.model_dump() for note in notes]
    
    return router
```

**Why factory functions?**
- Enables dependency injection
- Allows testing with different service implementations
- Keeps routes framework-agnostic (except for FastAPI decorators)

### 7. Schema Pattern (MANDATORY)

Use **three-layer schema approach**:

1. **Request Schema**: API input (create/update) - `NoteRequestSchema`
2. **Response Schema**: API output - `NoteResponseSchema`
3. **Domain Entity**: Business object - `Note`

```python
# src/domains/notes/api/schemas.py
class NoteRequestSchema(BaseModel):
    """Unified schema for creating and updating notes (matching frontend)."""
    id: Optional[str] = None  # Optional for create
    title: str = Field(..., min_length=1)
    content: str = Field(..., min_length=1)
    category: Optional[str] = None
    tags: list[str] = Field(default_factory=list)

class NoteResponseSchema(BaseModel):
    """Schema for note API responses."""
    id: str
    title: str
    content: str
    last_modified_utc: datetime
    category: Optional[str]
    tags: list[str]
```

**Why unified Request Schema?**
- Matches frontend pattern (single `Note` type)
- Simpler API surface
- `id` field being optional handles create vs. update distinction

### 8. Common Layer Rules

- **NEVER** import from domains or app in `common/`
- **ONLY** plain Python (no FastAPI, Pydantic, database libraries)
- Use domain errors from `common/errors.py`

## Common Tasks & Patterns

### Adding a New Domain/Feature

1. Create domain folder: `src/domains/<feature-name>/`
2. Create structure:
   ```
   domains/<feature>/
   ├── entities/
   │   └── <entity>.py
   ├── repositories/
   │   ├── <feature>_repository_port.py
   │   └── in_memory_<feature>_repository.py
   ├── services/
   │   └── <feature>_service.py
   ├── api/
   │   ├── routes.py
   │   └── schemas.py
   └── tests/
       └── test_<feature>_service.py
   ```
3. Implement entities (Pydantic BaseModel)
4. Define repository Protocol
5. Implement in-memory repository
6. Implement service with business logic
7. Create request/response schemas
8. Create router factory
9. Update `src/app/bootstrap.py` to wire dependencies
10. Register router in `src/app/main.py`

### Creating a New Entity

**Do:**
```python
# src/domains/notes/entities/note.py
from pydantic import BaseModel, Field
from datetime import datetime, timezone
from uuid import uuid4
from typing import Optional
from src.common.errors import ValidationError

class Note(BaseModel):
    id: str = Field(..., min_length=1)
    title: str = Field(..., min_length=1)
    content: str = Field(..., min_length=1)
    last_modified_utc: datetime
    category: Optional[str] = None
    tags: list[str] = Field(default_factory=list)
    
    def validate_entity(self) -> None:
        """Domain-specific validation."""
        errors: list[str] = []
        if not self.title.strip():
            errors.append('Title cannot be empty')
        if errors:
            raise ValidationError(f"Validation failed: {'; '.join(errors)}", errors)
    
    @classmethod
    def from_request_schema(cls, schema: NoteRequestSchema, id: str | None = None) -> 'Note':
        """Create from request schema."""
        return cls(
            id=id or str(uuid4()),
            title=schema.title,
            content=schema.content,
            last_modified_utc=datetime.now(timezone.utc),
            category=schema.category,
            tags=schema.tags
        )
    
    def model_dump(self) -> dict:
        """Use Pydantic's model_dump() for serialization."""
        return super().model_dump()
```

**Don't:**
- ❌ Use plain Python classes instead of Pydantic BaseModel
- ❌ Create manual `to_dict()` methods (use `model_dump()`)
- ❌ Put FastAPI-specific code in entities
- ❌ Skip domain validation methods

### Modifying Data Model (Adding/Removing Fields)

1. **Update Entity** (`src/domains/<feature>/entities/<entity>.py`):
   ```python
   class Note(BaseModel):
       # Add new field
       new_field: str = Field(default="")
       # OR remove field
       # old_field: str  # Remove this
   ```

2. **Update Request Schema** (`src/domains/<feature>/api/schemas.py`):
   ```python
   class NoteRequestSchema(BaseModel):
       new_field: Optional[str] = None  # Add matching field
   ```

3. **Update Response Schema** (`src/domains/<feature>/api/schemas.py`):
   ```python
   class NoteResponseSchema(BaseModel):
       new_field: str  # Add matching field
   ```

4. **Update `from_request_schema()` method** in entity:
   ```python
   @classmethod
   def from_request_schema(cls, schema: NoteRequestSchema, id: str | None = None) -> 'Note':
       return cls(
           # ... existing fields
           new_field=schema.new_field or "",  # Handle new field
       )
   ```

5. **Update Repository Protocol** if needed (e.g., new query methods)

6. **Update Repository Implementations** (both in-memory and any database-backed)

7. **Update Service** if new business logic needed

8. **Update Routes** if new endpoints needed

### Adding a New Repository Method

1. **Add method to Protocol** (`src/domains/<feature>/repositories/<feature>_repository_port.py`):
   ```python
   class NotesRepositoryPort(Protocol):
       async def get_notes_by_category(self, category: str) -> list[Note]:
           """Retrieve notes by category."""
           ...
   ```

2. **Implement in In-Memory Repository** (`src/domains/<feature>/repositories/in_memory_<feature>_repository.py`):
   ```python
   async def get_notes_by_category(self, category: str) -> list[Note]:
       return [note for note in self._notes.values() if note.category == category]
   ```

3. **Implement in Service** (`src/domains/<feature>/services/<feature>_service.py`):
   ```python
   async def get_notes_by_category(self, category: str) -> list[Note]:
       return await self.repository.get_notes_by_category(category)
   ```

4. **Add Route** (if exposing via API):
   ```python
   @router.get("/category/{category}", response_model=list[NoteResponseSchema])
   async def get_notes_by_category(category: str):
       notes = await service.get_notes_by_category(category)
       return [note.model_dump() for note in notes]
   ```

### Adding a New Route/Endpoint

**Do:**
```python
# src/domains/notes/api/routes.py
def create_notes_router(service: NotesService) -> APIRouter:
    router = APIRouter(prefix="/notes", tags=["notes"])
    
    @router.get("/new-endpoint", response_model=list[NoteResponseSchema])
    async def new_endpoint(param: str):
        """Clear docstring explaining the endpoint."""
        try:
            notes = await service.some_method(param)
            return [note.model_dump() for note in notes]
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e)
            )
    
    return router
```

**Don't:**
- ❌ Add business logic directly in route handlers
- ❌ Call repository directly from route (use service)
- ❌ Skip error handling
- ❌ Forget to add `response_model` for type safety

### Data Mocking (In-Memory Repository)

**Current Setup:**
- In-memory repository persists data **across requests** within the same process
- Data resets **only on server restart**
- Perfect for local development and frontend integration

**Adding Mock Data:**
```python
# src/domains/notes/repositories/in_memory_notes_repository.py
class InMemoryNotesRepository:
    def __init__(self):
        self._notes: dict[str, Note] = {}
        self._initialize_mock_data()
    
    def _initialize_mock_data(self):
        """Initialize with mock data."""
        mock_notes = [
            Note(
                id='1',
                title='Mock Note 1',
                content='Content here',
                last_modified_utc=datetime.now(timezone.utc),
                category='test',
                tags=['mock']
            ),
            # Add more mock data
        ]
        for note in mock_notes:
            self._notes[note.id] = note
```

**For Testing:**
- Create fresh repository instances per test
- Don't share state between tests
- Use pytest fixtures to create isolated repositories

### Adding Validation Logic

**Entity-Level Validation:**
```python
# In entity class
def validate_entity(self) -> None:
    """Domain-specific validation."""
    errors: list[str] = []
    
    # Business rules
    if len(self.title) > 100:
        errors.append('Title must be 100 characters or less')
    if 'forbidden' in self.content.lower():
        errors.append('Content contains forbidden words')
    
    if errors:
        raise ValidationError(f"Validation failed: {'; '.join(errors)}", errors)
```

**Service-Level Validation:**
```python
# In service class
async def create_note(self, note: Note) -> None:
    # Entity validation
    note.validate_entity()
    
    # Business logic validation
    existing_notes = await self.repository.get_notes()
    if len(existing_notes) >= 1000:
        raise ValidationError("Maximum number of notes reached", [])
    
    await self.repository.create_note(note)
```

**Schema-Level Validation (Pydantic):**
```python
# In schema
class NoteRequestSchema(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    content: str = Field(..., min_length=1)
    
    @field_validator('tags')
    @classmethod
    def validate_tags(cls, v):
        if len(v) > 10:
            raise ValueError('Maximum 10 tags allowed')
        return v
```

### Error Handling

**Domain Errors:**
```python
# src/common/errors.py
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

**In Routes:**
```python
@router.post("", response_model=NoteResponseSchema)
async def create_note(schema: NoteRequestSchema):
    try:
        note = Note.from_request_schema(schema)
        note.validate_entity()
        await service.create_note(note)
        return note.model_dump()
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
```

### Testing Patterns

**Philosophy**: Test business logic and workflows, not implementation details.

**Unit Tests** (Service Layer):
```python
# tests/domains/notes/test_notes_service.py
import pytest
from src.domains.notes.services.notes_service import NotesService
from src.domains.notes.repositories.in_memory_notes_repository import InMemoryNotesRepository
from src.domains.notes.entities.note import Note

@pytest.fixture
def repository():
    return InMemoryNotesRepository()

@pytest.fixture
def service(repository):
    return NotesService(repository)

@pytest.mark.asyncio
async def test_create_note(service):
    """Test that creating a note works."""
    note = Note(
        id="test-1",
        title="Test Note",
        content="Content",
        last_modified_utc=datetime.now(timezone.utc),
        category=None,
        tags=[]
    )
    await service.create_note(note)
    
    retrieved = await service.get_note_by_id("test-1")
    assert retrieved.title == "Test Note"
```

**Integration Tests** (Full API):
```python
# tests/api/test_notes_api.py
from fastapi.testclient import TestClient
from src.app.main import create_app

@pytest.fixture
def client():
    app = create_app()
    return TestClient(app)

def test_get_notes(client):
    """Test GET /notes endpoint."""
    response = client.get("/notes")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
```

**Test Isolation Rules:**
- ✅ Create fresh repository instances per test
- ✅ Use pytest fixtures for dependencies
- ✅ Mock external services/databases
- ✅ Test async methods with `@pytest.mark.asyncio`
- ❌ Never share repository state between tests
- ❌ Never test private methods directly

**Running Tests:**
```bash
# Basic
pytest

# With watch mode (hot reload)
ptw  # Requires: pip install pytest-watch

# Specific file
pytest tests/domains/notes/test_notes_service.py

# Verbose
pytest -v

# Stop on first failure
pytest -x
```

## Code Examples from Codebase

### Complete Entity
See: `src/domains/notes/entities/note.py`

### Complete Repository Port
See: `src/domains/notes/repositories/notes_repository_port.py`

### Complete In-Memory Repository
See: `src/domains/notes/repositories/in_memory_notes_repository.py`

### Complete Service
See: `src/domains/notes/services/notes_service.py`

### Complete Router Factory
See: `src/domains/notes/api/routes.py`

### Complete Bootstrap
See: `src/app/bootstrap.py`

### Complete Schemas
See: `src/domains/notes/api/schemas.py`

## File Naming Conventions

- **Entities**: `snake_case.py` (e.g., `note.py`, `user_profile.py`)
- **Services**: `snake_case.py` (e.g., `notes_service.py`)
- **Repositories**: `snake_case.py` (e.g., `in_memory_notes_repository.py`, `notes_repository_port.py`)
- **Routes**: `routes.py` or `snake_case_routes.py`
- **Schemas**: `schemas.py` or `snake_case_schemas.py`
- **Tests**: `test_<module>.py` (e.g., `test_notes_service.py`)
- **Bootstrap**: `bootstrap.py`

## Import Path Conventions

- Use absolute imports from `src/`:
  ```python
  from src.domains.notes.entities.note import Note
  from src.domains.notes.services.notes_service import NotesService
  from src.common.errors import ValidationError
  ```

## What NOT to Do

❌ **Never**:
- Make database/HTTP calls from routes or services (only in repositories)
- Import repository implementations in services (only Protocols)
- Put business logic in routes
- Use plain Python classes for entities (use Pydantic BaseModel)
- Create manual `to_dict()` methods (use `model_dump()`)
- Skip Protocol definitions for repositories
- Share repository state between tests
- Skip validation in service methods
- Forget to handle errors in routes
- Put FastAPI-specific code in entities/services
- Create routes without factory functions
- Use `Optional[...]` without `None` default for optional fields
- Skip docstrings on public methods

✅ **Always**:
- Use Pydantic BaseModel for entities
- Define repository Protocols before implementations
- Use factory functions for routers
- Inject dependencies via constructor
- Validate entities in service methods
- Handle errors appropriately in routes
- Use `model_dump()` for serialization
- Use `model_validate()` for deserialization
- Write async methods for async operations
- Use type hints everywhere
- Create in-memory repository for development
- Provide both Protocol and implementation
- Test business logic, not implementation details

## Quick Checklist for Code Changes

Before submitting changes, verify:

- [ ] Dependencies flow correctly (no circular imports)
- [ ] Entity uses Pydantic BaseModel
- [ ] Entity has `validate_entity()` method
- [ ] Entity has `from_request_schema()` class method
- [ ] Repository has Protocol definition
- [ ] Repository Protocol and implementation match
- [ ] Service accepts repository via constructor
- [ ] Service calls entity validation
- [ ] Router is created via factory function
- [ ] Routes call service, not repository
- [ ] Request and Response schemas defined
- [ ] Routes have proper error handling
- [ ] Routes use `response_model` for type safety
- [ ] Bootstrap wires all dependencies
- [ ] Router registered in `main.py`
- [ ] Tests use fresh repository instances
- [ ] Tests are async with `@pytest.mark.asyncio`
- [ ] No business logic in routes
- [ ] No framework code in entities/services
- [ ] Type hints on all methods
- [ ] Docstrings on public methods

## Getting Help

1. **Architecture questions**: See `docs/project-setup.md`
2. **Monorepo principles**: See root `AGENTS.md`
3. **Pattern examples**: Check `src/domains/notes/` (reference implementation)
4. **Common infrastructure**: See `src/common/`

## Key Principles Summary

1. **Separation of Concerns**: Each layer has one responsibility
2. **Dependency Inversion**: Depend on abstractions (Protocols), not implementations
3. **Feature Self-Sufficiency**: Each domain is a complete, bootstrappable module
4. **Framework Agnostic Core**: Entities, repositories, services are plain Python
5. **Testability First**: Everything is mockable and testable
6. **Clarity Over Cleverness**: Code should be obvious to junior developers and AI agents
7. **Pydantic for Entities**: Use BaseModel for seamless serialization and validation

---

**Remember**: When in doubt, check the `notes` domain (`src/domains/notes/`) - it's the reference implementation for all patterns.

