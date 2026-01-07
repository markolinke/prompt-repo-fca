# Notes Service - Project Setup Documentation

This document explains how the notes service is structured, why certain decisions were made, and how to work with the codebase.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Key Design Decisions](#key-design-decisions)
4. [In-Memory Repository Behavior](#in-memory-repository-behavior)
5. [Schema Design](#schema-design)
6. [Testing Setup](#testing-setup)
7. [Configuration Files](#configuration-files)
8. [Schema Conversion Patterns](#schema-conversion-patterns)

---

## Architecture Overview

This service follows **Clean Architecture** principles, matching the patterns used in the frontend application. The architecture emphasizes:

- **Dependency Direction**: Outer layers depend on inner layers (API → Service → Repository → Infrastructure)
- **Domain-Driven Design**: Each domain is self-contained with entities, services, repositories, and tests
- **Ports and Adapters**: Use protocol/interfaces at boundaries (repositories, HTTP clients)
- **Framework-Agnostic Core**: Business logic (entities, services) is plain Python with no framework dependencies

### Layers

```
┌─────────────────────────────────────┐
│   API Layer (FastAPI Routes)        │  ← Framework-specific
├─────────────────────────────────────┤
│   Service Layer (Business Logic)    │  ← Domain logic
├─────────────────────────────────────┤
│   Repository Port (Interface)       │  ← Abstraction
├─────────────────────────────────────┤
│   Repository Implementation         │  ← Infrastructure
└─────────────────────────────────────┘
```

---

## Project Structure

```
notes-service/
├── src/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry point
│   │   └── bootstrap.py         # Dependency injection / wiring
│   ├── common/
│   │   └── errors.py            # DomainError, ValidationError
│   └── domains/
│       └── notes/
│           ├── entities/
│           │   └── note.py      # Domain entity (Pydantic BaseModel)
│           ├── services/
│           │   └── notes_service.py
│           ├── repositories/
│           │   ├── notes_repository_port.py  # Protocol/interface
│           │   └── in_memory_notes_repository.py  # Implementation
│           └── api/
│               ├── routes.py    # FastAPI routes
│               └── schemas.py   # Pydantic models for API
├── tests/
│   └── domains/
│       └── notes/
│           └── test_notes_service.py
├── requirements.txt
├── run.py                        # Development server entry point
└── docs/
    └── project-setup.md         # This file
```

---

## Key Design Decisions

### 1. Why Pydantic BaseModel for Domain Entities?

The `Note` entity uses Pydantic's `BaseModel` instead of plain Python classes because:

- **MongoDB Compatibility**: Pydantic models serialize seamlessly to BSON for MongoDB storage
- **Built-in Validation**: Pydantic provides field-level validation with clear error messages
- **Type Safety**: Strong type hints with runtime validation
- **FastAPI Integration**: FastAPI can automatically serialize/deserialize Pydantic models
- **Model Helpers**: Methods like `model_dump()`, `model_validate()` simplify conversions

**Example:**
```python
class Note(BaseModel):
    id: str = Field(..., min_length=1)
    title: str = Field(..., min_length=1)
    # ... other fields
    
    @classmethod
    def from_request_schema(cls, schema: NoteRequestSchema) -> 'Note':
        # Clean conversion using Pydantic
        return cls(...)
    
    def to_response_schema(self) -> dict:
        return self.model_dump()  # Seamless serialization
```

### 2. Unified Schema Design (Matching Frontend)

We use a **single `NoteRequestSchema`** for both create and update operations, matching the frontend pattern where the same `Note` type is used for both:

```python
class NoteRequestSchema(BaseModel):
    """Unified schema for creating and updating notes."""
    id: Optional[str] = None  # Optional for create, required for update
    title: str
    content: str
    category: Optional[str] = None
    tags: list[str] = Field(default_factory=list)
```

**Why not separate Create/Update schemas?**
- The frontend uses the same type for both operations
- Simpler API surface
- Less code duplication
- The `id` field being optional handles the distinction naturally

### 3. Test Colocation

Tests are currently in a separate `tests/` directory following pytest conventions. However, **colocation is also supported** (like the frontend pattern). Both approaches work:

**Option A: Separate (current)**
```
tests/domains/notes/test_notes_service.py
```

**Option B: Colocated (matches frontend)**
```
src/domains/notes/services/test_notes_service.py
```

Configure pytest to search both locations in `pytest.ini` or `pyproject.toml`:
```ini
[pytest]
testpaths = ["tests", "src"]
```

---

## In-Memory Repository Behavior

### How It Works

The `InMemoryNotesRepository` is instantiated **once at application startup** in `bootstrap.py`. This means:

1. **Shared State**: All HTTP requests share the same in-memory dictionary
2. **Persistence**: Data persists across requests as long as the uvicorn process runs
3. **Process Lifecycle**: State resets only when uvicorn restarts

### Example Flow

```python
# At startup (bootstrap.py)
repository = InMemoryNotesRepository()  # Created once

# Request 1: POST /notes
# → Adds note to repository._notes dictionary

# Request 2: GET /notes
# → Retrieves from same repository._notes dictionary ✅

# Server restart
# → Repository recreated, data reset ❌
```

### Use Cases

✅ **Perfect for**:
- Local development and testing
- Prototyping
- Frontend integration testing

❌ **Not suitable for**:
- Production (data is lost on restart)
- Multi-instance deployments
- Persistent storage needs

**Solution**: When ready for production, implement a database-backed repository (e.g., `MongoNotesRepository`) following the same `NotesRepositoryPort` interface.

---

## Schema Design

### Three-Layer Schema Approach

1. **Domain Entity** (`Note`): Core business object with validation
2. **Request Schema** (`NoteRequestSchema`): API input (create/update)
3. **Response Schema** (`NoteResponseSchema`): API output

### Why Separate Request/Response Schemas?

- **Request**: May omit fields (like `id` for create), include optional fields
- **Response**: Always includes all fields (like `last_modified_utc`, `id`)
- **Evolution**: Can change independently as API evolves
- **Security**: Control what data is exposed vs. accepted

### Conversion Flow

```
HTTP Request
    ↓
NoteRequestSchema (Pydantic validation)
    ↓
Note.from_request_schema() → Note (Domain Entity)
    ↓
Service Layer (Business Logic)
    ↓
Repository (Storage)
    ↓
Note (Domain Entity)
    ↓
Note.model_dump() → NoteResponseSchema
    ↓
HTTP Response
```

---

## Testing Setup

### Running Tests

**Basic:**
```bash
pytest
pytest tests/
pytest -v  # Verbose output
pytest -xvs  # Stop on first failure, verbose, no capture
```

**With Watch Mode (Hot Reload):**

Install pytest-watch:
```bash
pip install pytest-watch
```

Run with auto-reload:
```bash
ptw  # Watches all changes
ptw tests/  # Watch specific directory
ptw --runner "pytest -xvs"  # Custom flags
```

### Test Discovery

Pytest automatically discovers tests matching:
- Files: `test_*.py` or `*_test.py`
- Functions: `test_*`
- Classes: `Test*`

### Async Tests

All repository and service methods are async, so use:
```python
@pytest.mark.asyncio
async def test_create_note(service):
    note = Note(...)
    await service.create_note(note)
```

---

## Configuration Files

### pytest.ini vs pyproject.toml

You have two options for pytest configuration:

#### Option A: pytest.ini (Simple, pytest-only)

Create `pytest.ini` in project root:
```ini
[pytest]
testpaths = tests
asyncio_mode = auto
pythonpath = src
addopts = -v --tb=short
```

**When to use:**
- Simple pytest-only configuration
- You don't need other tool configs
- Prefer explicit, dedicated config files

#### Option B: pyproject.toml (Modern, multi-tool)

Create `pyproject.toml` in project root:
```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
asyncio_mode = "auto"
pythonpath = ["src"]
addopts = "-v --tb=short"

[project]
name = "notes-service"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
    "fastapi==0.115.0",
    # ... other deps
]

[project.optional-dependencies]
dev = [
    "pytest==8.3.3",
    "pytest-asyncio==0.24.0",
    "pytest-watch==4.2.0",
]
```

**When to use:**
- Modern Python project (PEP 518 standard)
- Want to configure multiple tools (pytest, black, mypy, ruff)
- Prefer single configuration file
- Using dependency management with `pip install -e .`

**Recommendation**: Start with `pytest.ini` for simplicity, migrate to `pyproject.toml` if you add more tooling.

---

## Schema Conversion Patterns

### Using Pydantic Helpers

Since both `Note` (entity) and `NoteRequestSchema` are Pydantic models, we use Pydantic's built-in methods:

#### From Schema to Entity

**Manual (avoid):**
```python
note = Note(
    id=str(uuid4()),
    title=schema.title,
    content=schema.content,
    # ... manual field mapping
)
```

**Using Class Method (preferred):**
```python
note = Note.from_request_schema(schema)
# or with explicit ID
note = Note.from_request_schema(schema, id=note_id)
```

Implementation:
```python
@classmethod
def from_request_schema(cls, schema: NoteRequestSchema, id: str | None = None) -> 'Note':
    return cls(
        id=id or str(uuid4()),
        title=schema.title,
        content=schema.content,
        last_modified_utc=datetime.now(timezone.utc),
        category=schema.category,
        tags=schema.tags
    )
```

#### From Entity to Response

**Using model_dump():**
```python
# In routes
return note.model_dump()  # Converts to dict, FastAPI serializes
```

Or let FastAPI handle it automatically (if response_model matches):
```python
@router.get("", response_model=list[NoteResponseSchema])
async def get_notes():
    notes = await service.get_notes()
    return notes  # FastAPI serializes Pydantic models automatically!
```

#### From Dictionary (Database/JSON)

**Using model_validate():**
```python
@classmethod
def from_dict(cls, data: dict) -> 'Note':
    return cls.model_validate(data)
```

### Benefits

- ✅ Cleaner code with less manual mapping
- ✅ Leverages Pydantic's validation
- ✅ Type-safe conversions
- ✅ Easy to extend with custom validation
- ✅ Works seamlessly with MongoDB BSON

---

## Development Workflow

### Starting the Server

```bash
# Activate virtual environment
source env/bin/activate  # macOS/Linux
# OR: env\Scripts\activate  # Windows

# Run development server
python run.py

# OR using uvicorn directly
uvicorn src.app.main:app --reload --host 0.0.0.0 --port 8000
```

### API Endpoints

- **Health Check**: `GET http://localhost:8000/health`
- **API Docs**: `http://localhost:8000/docs` (Swagger UI)
- **Alternative Docs**: `http://localhost:8000/redoc`
- **Get Notes**: `GET http://localhost:8000/notes`
- **Get Note**: `GET http://localhost:8000/notes/{id}`
- **Create Note**: `POST http://localhost:8000/notes`
- **Update Note**: `PUT http://localhost:8000/notes/{id}`
- **Delete Note**: `DELETE http://localhost:8000/notes/{id}`
- **Search Notes**: `GET http://localhost:8000/notes/search?query=...`

### Frontend Integration

The service is configured to accept requests from the Vue frontend running on `http://localhost:5173` (CORS enabled). The API schema matches the frontend's `Note` interface, ensuring seamless integration.

---

## Next Steps

### Future Enhancements

1. **Database Persistence**: Implement `MongoNotesRepository` or `SQLiteNotesRepository`
2. **Error Handling**: Add global exception handlers
3. **Logging**: Integrate structured logging
4. **Authentication**: Add auth middleware
5. **Integration Tests**: Add API-level tests with httpx
6. **Validation**: Enhance domain validation rules
7. **Pagination**: Add pagination for list endpoints

### Migration Path to Production

When moving to production:

1. Replace `InMemoryNotesRepository` with database-backed implementation
2. Add environment-based configuration (use `pydantic-settings`)
3. Add proper error handling and logging
4. Add authentication/authorization
5. Add request rate limiting
6. Set up monitoring and health checks
7. Configure CORS for production origins

The Clean Architecture makes this migration straightforward: only the repository implementation changes, the service and API layers remain unchanged.

---

## Questions?

For architecture decisions, refer back to:
- Root `AGENTS.md` - Monorepo-wide Clean Architecture principles
- Frontend `applications/frontend-app/AGENTS.md` - Frontend-specific patterns
- This document - Service-specific implementation details

