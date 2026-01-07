# Backend Service Architecture Guidelines

## Philosophy

Our backend service is **not** the place for presentation logic or UI concerns — that belongs on the frontend.

The backend's primary role is:

- To serve as a **business logic layer** (domain rules, validation, workflows)
- To provide **reliable APIs** for frontend clients
- To handle **data persistence** and **cross-cutting concerns** (auth, logging, etc.)

We follow **Clean Architecture** principles:

- Combination of Clean Architecture (by domain) and Feature-Sliced Design (slice by feature)
- We keep clean separation of concerns within each domain, but avoid deep folder nesting and heavy boilerplate.
- Each domain is self-contained with clear boundaries

**Core principles:**

- **Clarity over cleverness**: Simple, explicit code that junior developers and AI agents can understand in minutes
- **Readability**: Code should read like well-written prose, with business meaning in names and structure
- **Testability**: Everything is mockable and testable; **100% test coverage** is our target
- **TDD as default**: Test-Driven Development — write tests first, then implement the simplest code that passes
- **Single responsibility per file/folder**: Each module has one clear purpose
- **Clear boundaries between layers**: Dependency rules are strict and enforced
- **SOLID principles**: Applied consistently across all layers
- **DRY (Don't Repeat Yourself)**: Extract shared logic, but prioritize clarity over abstraction
- **Minimal cognitive load**: Easy onboarding for new team members and AI agents
- **Features are self-sufficient modules** with a single public entry point (bootstrap function)

## Clean Architecture (per domain)

We apply Clean Architecture principles **locally within each domain**, not globally across the service.

Layers (from inner to outer):

| Layer              | Responsibility                                                                 | Technologies / Tools                     | Framework Dependencies | Testable? |
|--------------------|--------------------------------------------------------------------------------|------------------------------------------|------------------------|-----------|
| **Domain (Entities)** | Business entities, value objects, core business rules, domain validation | Pydantic BaseModel, plain Python        | None                   | Yes       |
| **Repository Port** | Data access interface (abstraction)                                           | Python Protocol (structural typing)     | None                   | Yes       |
| **Repository Implementation** | Data access implementation (database, API, in-memory)                        | Pydantic, async/await                    | None (DB driver only)  | Yes       |
| **Service**        | Use cases / business logic orchestration                                      | Plain Python classes, async/await       | None                   | Yes       |
| **API Schemas**    | Request/Response DTOs (API contracts)                                         | Pydantic BaseModel                       | FastAPI (type hints)   | Yes       |
| **API Routes**     | HTTP endpoints, request/response handling                                     | FastAPI, HTTP status codes               | FastAPI                | Yes       |
| **App**            | Application setup, dependency wiring, middleware                              | FastAPI, dependency injection            | FastAPI                | Yes       |

**Dependency Flow Rule**: Outer layers depend on inner layers. Inner layers **never** import from outer layers.

```
API Routes → Service → Repository Port ← Repository Implementation
     ↓
  Schemas → Entity
```

## Service Structure

```text
services/notes-service/
├── src/
│   ├── app/                           # FastAPI root: main.py, bootstrap, middleware
│   │   ├── main.py                    # FastAPI app factory and configuration
│   │   └── bootstrap.py               # Dependency injection / wiring
│   ├── common/                        # Cross-cutting infrastructure (framework-agnostic)
│   │   └── errors.py                  # DomainError, ValidationError base classes
│   └── domains/                       # Feature-Sliced Design (FSD) modules
│       └── notes/                     # Example feature – self-contained module
│           ├── entities/
│           │   └── note.py            # Domain entity (Pydantic BaseModel)
│           ├── repositories/
│           │   ├── notes_repository_port.py      # Protocol (interface)
│           │   └── in_memory_notes_repository.py # In-memory implementation
│           ├── services/
│           │   └── notes_service.py   # Business logic
│           ├── api/
│           │   ├── routes.py          # FastAPI router factory
│           │   └── schemas.py         # Request/Response Pydantic models
│           └── tests/
│               └── test_notes_service.py
├── tests/                             # Integration/E2E tests (optional separate location)
├── docs/
│   ├── architecture.md                # This file
│   └── project-setup.md               # Setup and design decisions
├── requirements.txt                   # Python dependencies
├── run.py                             # Development server entry point
└── README.md
```

### Domain Bootstrapping

- Each domain **must** have its dependencies wired in `src/app/bootstrap.py`
- The bootstrap function creates repository, service, and router instances
- Dependencies are injected via constructor (dependency injection)
- This replaces centralized wiring and makes domains plug-and-play

Example bootstrap (from `src/app/bootstrap.py`):

```python
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

The root application registers routers in `src/app/main.py`:

```python
def create_app() -> FastAPI:
    app = FastAPI(...)
    
    # Bootstrap dependencies
    dependencies = bootstrap_dependencies()
    
    # Register routers
    app.include_router(dependencies['notes_router'])
    
    return app
```

## Layer Responsibilities & Rules

### Dependency Injection and Ports

- Use **Python Protocols** for repository interfaces (structural typing, no explicit inheritance)
- Protocols are defined before implementations
- Services depend on Protocol interfaces, not concrete implementations
- This enables easy mocking and testing
- Follows **Dependency Inversion Principle** (SOLID)

**Why Protocols instead of ABC?**
- More Pythonic (duck typing)
- Structural typing — no explicit inheritance needed
- Service code doesn't need to import implementations
- Easier to mock and test

### Strict Rules (for developers & AI agents)

1. **No direct database/HTTP calls** from routes or services → always go through repositories
2. **No business logic** in routes or repositories → only in services or entities
3. **All data access** must be done through a repository (implements Protocol, with mock and database variants)
4. **Services** may only call repositories via Protocol interface (never concrete implementations directly in service code)
5. **Domain bootstrapping**:
   - Every domain has dependencies wired in `bootstrap_dependencies()`
   - Bootstrapping decides real vs. mock implementations based on environment/config
   - Central app only imports from bootstrap
6. **Mocking**:
   - Repositories: Provide `InMemory<Feature>Repository` for tests and development
   - Services: Test against mock repositories via Protocol interface
   - Entities: Use Pydantic BaseModel for easy serialization/deserialization
7. **Testing**:
   - **100% test coverage** is the target for all code
   - **TDD is the default**: Write tests first, then implement
   - Tests are colocated in each domain's `tests/` folder (e.g., `domains/notes/tests/`)
   - Use pytest for unit tests (service layer) and integration tests (API level)
   - Integration tests use real service + mock repository
   - Tests are organized by use case/business workflow, not by technical layer
   - See `AGENTS.md` for detailed testing guidelines and patterns
8. **Errors**: Generic errors in `common/errors.py`; feature-specific errors can extend these
9. **Validation**: 
   - Field-level validation in Pydantic models (schemas and entities)
   - Domain-level validation in entity `validate_entity()` methods
   - Business rule validation in services
10. **Entities**: Use Pydantic BaseModel for seamless MongoDB/BSON serialization and FastAPI integration
11. **Schemas**: Separate Request (API input) and Response (API output) schemas for clear API contracts

### SOLID Principles Applied

**Single Responsibility Principle (SRP)**:
- Each class/module has one reason to change
- Entities: Business rules and validation
- Services: Business logic orchestration
- Repositories: Data access
- Routes: HTTP request/response handling

**Open/Closed Principle (OCP)**:
- Open for extension (new repository implementations), closed for modification
- New features added by extending domains, not modifying existing code

**Liskov Substitution Principle (LSP)**:
- Any repository implementation can replace another if it implements the Protocol
- Mock repositories behave identically to production repositories

**Interface Segregation Principle (ISP)**:
- Protocols define minimal, focused interfaces
- Services depend only on methods they use

**Dependency Inversion Principle (DIP)**:
- High-level modules (services) don't depend on low-level modules (repositories)
- Both depend on abstractions (Protocols)
- Dependency injection via constructor

### DRY Principle

- Extract shared validation logic to entity methods
- Common error handling patterns in services
- Shared repository patterns (base classes if needed)
- **But**: Prioritize clarity over abstraction. If duplication makes code clearer, it's acceptable.

## Entity Layer (Domain)

### Purpose
- Represent core business concepts
- Enforce domain rules and validation
- Framework-agnostic (no FastAPI, database drivers, etc.)

### Implementation
- Use **Pydantic BaseModel** for:
  - Automatic validation
  - Type safety
  - Seamless serialization (MongoDB BSON, JSON)
  - FastAPI integration

### Pattern

```python
# src/domains/notes/entities/note.py
from pydantic import BaseModel, Field
from datetime import datetime, timezone
from uuid import uuid4
from typing import Optional
from src.common.errors import ValidationError

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
        if not self.title.strip():
            errors.append('Title cannot be empty')
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
    
    # Pydantic provides model_dump() and model_validate() automatically
```

### Rules
- ✅ Pure Python (no framework imports)
- ✅ Use Pydantic BaseModel
- ✅ Provide `validate_entity()` for domain rules
- ✅ Provide class methods for conversion (e.g., `from_request_schema()`)
- ✅ Use `model_dump()` for serialization (Pydantic built-in)
- ❌ No FastAPI dependencies
- ❌ No database driver dependencies
- ❌ No HTTP/client code

## Repository Layer

### Purpose
- Abstract data access
- Enable swapping implementations (in-memory, database, external API)
- Framework-agnostic interface

### Protocol (Port) Pattern

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

### Implementation Pattern

```python
# src/domains/notes/repositories/in_memory_notes_repository.py
class InMemoryNotesRepository:
    """In-memory implementation for development/testing."""
    
    def __init__(self):
        self._notes: dict[str, Note] = {}
        self._initialize_mock_data()
    
    async def get_notes(self) -> list[Note]:
        return list(self._notes.values())
    
    # ... implement all Protocol methods
```

### Rules
- ✅ Define Protocol before implementation
- ✅ Implement all Protocol methods
- ✅ Use async/await for I/O operations
- ✅ Return domain entities (not DTOs or raw data)
- ✅ Raise domain errors (ValueError, custom exceptions)
- ❌ No business logic (only data access)
- ❌ No FastAPI dependencies
- ❌ No service layer imports

## Service Layer

### Purpose
- Orchestrate business workflows
- Enforce business rules
- Coordinate between entities and repositories
- Framework-agnostic (no FastAPI, HTTP, etc.)

### Pattern

```python
# src/domains/notes/services/notes_service.py
from src.domains.notes.entities.note import Note
from src.domains.notes.repositories.notes_repository_port import NotesRepositoryPort

class NotesService:
    """Service layer for notes business logic."""
    
    def __init__(self, repository: NotesRepositoryPort):
        self.repository = repository
    
    async def create_note(self, note: Note) -> None:
        """Create a new note with validation."""
        note.validate_entity()  # Domain validation
        # Business logic validation (e.g., check limits, permissions)
        await self.repository.create_note(note)
```

### Rules
- ✅ Accept repository via constructor (dependency injection)
- ✅ Call entity validation methods
- ✅ Contain business logic, not just pass-through
- ✅ Use async/await for repository calls
- ✅ Return domain entities or raise domain errors
- ❌ No FastAPI dependencies
- ❌ No HTTP/database code
- ❌ No direct data access (only via repository)

## API Layer (Routes & Schemas)

### Purpose
- Handle HTTP request/response
- Convert between API schemas and domain entities
- Framework-specific (FastAPI)

### Schema Pattern

```python
# src/domains/notes/api/schemas.py
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class NoteRequestSchema(BaseModel):
    """Unified schema for creating and updating notes."""
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

### Router Factory Pattern

```python
# src/domains/notes/api/routes.py
def create_notes_router(service: NotesService) -> APIRouter:
    """Create and configure the notes router."""
    router = APIRouter(prefix="/notes", tags=["notes"])
    
    @router.get("", response_model=list[NoteResponseSchema])
    async def get_notes():
        notes = await service.get_notes()
        return [note.model_dump() for note in notes]
    
    @router.post("", response_model=NoteResponseSchema, status_code=status.HTTP_201_CREATED)
    async def create_note(schema: NoteRequestSchema):
        note = Note.from_request_schema(schema)
        note.validate_entity()
        await service.create_note(note)
        return note.model_dump()
    
    return router
```

### Rules
- ✅ Use factory functions for routers (enables dependency injection)
- ✅ Convert schemas to entities using entity class methods
- ✅ Call service methods (never repository directly)
- ✅ Handle errors and convert to HTTP status codes
- ✅ Use `response_model` for type safety and API docs
- ✅ Use Pydantic's `model_dump()` for serialization
- ❌ No business logic (only request/response handling)
- ❌ No direct repository access

## Testing Strategy

### Philosophy

Our testing strategy focuses on **business value and workflows**, not technical implementation details. We test **use cases and domain scenarios**, not individual functions in isolation. This approach ensures that tests verify whether features work correctly, not just whether code executes.

We follow **TDD (Test-Driven Development)** as the default:

1. **Write tests first** — describe the desired behavior
2. **Implement simplest code** that makes tests pass
3. **Refactor** with confidence (tests provide safety net)

### Test Types

1. **Unit Tests** (Service Layer)
   - Test services with mock repositories
   - Verify business logic and validation
   - Located in `domains/<feature>/tests/test_<service>.py`
   - Example: `test_notes_service.py`

2. **Integration Tests** (API Level)
   - Test complete API workflows
   - Real service + mock repository
   - Test HTTP endpoints end-to-end
   - Located in `tests/api/` or `domains/<feature>/tests/test_api.py`

### What We Test

✅ **DO Test:**
- Complete business workflows (e.g., "creating a note with validation")
- Domain scenarios and use cases
- Business logic and validation rules
- Error handling and edge cases
- API contracts (request/response schemas)

❌ **DON'T Test:**
- Implementation details (e.g., "does service call repository method X")
- Framework internals (FastAPI routing, Pydantic validation)
- Private methods directly
- Technical details that don't affect business outcomes

### Test Organization

```text
domains/<feature>/tests/
├── test_<feature>_service.py    # Unit tests (service layer)
└── test_<feature>_api.py        # Integration tests (API endpoints)
```

### Test Isolation

- ✅ Create fresh repository instances per test
- ✅ Use pytest fixtures for dependencies
- ✅ Mock external services/databases
- ✅ Test async methods with `@pytest.mark.asyncio`
- ❌ Never share repository state between tests
- ❌ Never test private methods directly

### Example Test Pattern

```python
# tests/domains/notes/test_notes_service.py
import pytest
from src.domains.notes.services.notes_service import NotesService
from src.domains.notes.repositories.in_memory_notes_repository import InMemoryNotesRepository

@pytest.fixture
def repository():
    return InMemoryNotesRepository()

@pytest.fixture
def service(repository):
    return NotesService(repository)

@pytest.mark.asyncio
async def test_create_note_validates_business_rules(service):
    """Test that creating a note enforces business rules."""
    note = Note(...)
    await service.create_note(note)
    # Assert business outcome
```

### 100% Test Coverage Target

- All service methods must have tests
- All entity validation logic must be tested
- All error paths must be tested
- Integration tests cover happy paths and common errors
- Coverage tools (pytest-cov) help identify gaps

**Coverage Metrics**:
- **Statements**: Percentage of code lines executed
- **Branches**: Percentage of conditional paths tested
- **Functions**: Percentage of functions called
- **Lines**: Percentage of lines executed

**Target**: 100% coverage for service and entity layers. API routes should have integration test coverage.

## Code Quality Principles

### Clarity & Readability

- **Self-documenting code**: Names describe business meaning, not technical detail
- **Simple over clever**: Prefer explicit code over abstractions that hide intent
- **Consistent patterns**: Follow established patterns across codebase
- **Comments for why, not what**: Code should explain what, comments explain why

### Testability

- **Dependency injection**: All dependencies passed via constructor
- **Protocols for interfaces**: Easy to mock and test
- **Pure functions where possible**: Easier to test
- **Side effects isolated**: Repository layer handles all I/O

### Maintainability

- **Small, focused modules**: Single responsibility per file
- **Domain language consistency**: Same terms used across entities, services, repositories
- **Clear boundaries**: Layer responsibilities are explicit
- **Easy to extend**: New features added by extending, not modifying

### DRY vs. Clarity

- **Extract shared logic**: Validation, error handling, common patterns
- **But prioritize clarity**: If duplication makes code clearer, it's acceptable
- **Avoid premature abstraction**: Wait until pattern emerges (rule of three)

## Recommended Tools

- **Web framework**: FastAPI (async, type-safe, automatic OpenAPI docs)
- **Validation/Serialization**: Pydantic (type-safe, fast, integrates with FastAPI)
- **HTTP client (for tests)**: httpx (async, compatible with FastAPI TestClient)
- **Testing**: pytest + pytest-asyncio (async test support)
- **Test coverage**: pytest-cov (coverage reporting)
- **Type checking**: mypy (static type checking)
- **Code quality**: ruff or black (formatting), pylint or flake8 (linting)
- **Database (future)**: MongoDB with motor (async driver), or SQLAlchemy (async)

## Alignment with Frontend

This backend architecture aligns with the frontend's Clean Architecture:

- **Domains match**: Frontend and backend share the same domain concepts (e.g., `notes`)
- **Similar structure**: Both use domain-first organization
- **Protocol/Interface alignment**: Frontend `RepositoryPort` matches backend API
- **Bootstrap pattern**: Both use dependency injection at app initialization
- **Testing philosophy**: Both focus on business workflows, not implementation details

This ensures seamless integration and consistent patterns across the stack.

## Summary

This architecture ensures:

- ✅ **Clear separation of concerns** (layers with distinct responsibilities)
- ✅ **Testability** (everything mockable, 100% coverage target)
- ✅ **Maintainability** (small modules, clear boundaries)
- ✅ **Extensibility** (easy to add features without modifying existing code)
- ✅ **Framework independence** (core logic doesn't depend on FastAPI)
- ✅ **TDD-friendly** (tests first, then implementation)
- ✅ **Clarity** (code that's easy to understand for junior developers and AI agents)
- ✅ **SOLID principles** (applied consistently)
- ✅ **DRY** (with clarity prioritization)

The structure ensures domains are modular, highly testable, and easy to onboard or extract. See `project-setup.md` for setup and implementation details, and `AGENTS.md` for practical patterns and rules.

