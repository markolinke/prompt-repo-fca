# Core Layers (Entities, Repositories, Services) Guidelines

## Philosophy

In our Flat Clean Architecture, the core layers—Entities (domain), Repositories (data), and Services (application)—form the foundation of each feature. These layers are **frontend framework-agnostic** (pure TypeScript) and focus on clear separation of concerns. They adhere to SOLID principles and Clean Architecture to enable quick testing, refactoring, pivoting, and onboarding, even in a startup environment where we need to be nimble and resilient.

- **Entities**: Represent business/domain models with basic validation.
- **Repositories**: Handle data access and mapping (e.g., DTO to domain), implementation-agnostic via a mandated port/interface.
- **Services**: Implement use cases as thin facades or orchestrators, leaning on backend for heavy business logic and validation.

We optimize for **clarity**: Layers are sharply divided, folders self-explanatory, and naming consistent. No mixing of concerns—e.g., no HTTP calls in services. Aim for ~100% test coverage (with rare exceptions) to minimize risks and automate reviews. These layers do **not** contain presentation logic (e.g., no Pinia or Vue dependencies).

Business logic stays on the backend where possible (zone of trust). Frontend services handle only client-side needs like multi-step flows or simple calculations.

## Core Principles

- **Single Responsibility**: Each layer/file does one thing (e.g., entities validate themselves; repositories map data).
- **Dependency Inversion**: Services depend on repository ports (interfaces), not concrete implementations.
- **Testability**: Every feature **should** provide a mock repository. Services are tested against mocks for real logic with controlled data.
- **Repository Implementation Agnostic**: Mandate a port for swapping (e.g., HTTP vs. mock vs. local storage).
- **Thin Services**: Allowed (often expected) as pass-throughs to repositories when backend owns logic. Add orchestration only for frontend-specific needs (e.g., complex form calculations not suited for backend).
- **Validation**: Basic checks in entities (e.g., required fields) to avoid embarrassing UI errors; heavy validation on backend.
- **Error Handling**: [TO BE DECIDED] for full patterns (e.g., wrapping vs. propagating). Recommend type-safe, centralized errors extending a base `DomainError` for now.
- **DTOs and Value Objects**: Place in appropriate layers (e.g., raw API payloads in repositories if used for mapping). [TO BE DECIDED] for exact conventions; for now, use plain objects or types near where they're consumed.
- **Naming and Placement**: Consistent suffixes (e.g., `Port` for interfaces). Flexible feature naming (e.g., `features/note/` singular or `features/notes/` plural based on context like "library of notes").
- **Barrel Files (`index.ts`)**: Expose only what's intended for external use (e.g., bootstrap function, types if needed). [TO BE DECIDED] for exact rules; principle: controlled exposure to enforce single-entry-point.

## Folder Structure within a Feature

Core layers live inside each feature folder (e.g., `features/notes/` or `domains/notes/` for flexibility). Example structure (adapted from provided tree):

```
features/notes/
├── entities/
│   └── Note.ts                  # Domain entities
├── repositories/
│   ├── NoteRepositoryPort.ts    # Mandated port/interface
│   ├── HttpNoteRepository.ts    # Real HTTP implementation
│   └── MockNoteRepository.ts    # Mock for tests/dev
├── services/
│   └── NoteService.ts           # Use cases
├── tests/                         # Feature-level tests (e.g., integration)
│   ├── NoteMockData.ts          # Mock data helpers
│   └── NoteService.test.ts      # Service tests
├── bootstrap.ts                   # Wires layers (real vs. mock)
├── index.ts                       # Barrel: exports bootstrap, types if needed
└── ... (other layers like store/, components/)
```

Tests are colocated in `tests/` folders within each layer (e.g., `services/tests/` if needed, but often at feature root for services).

## Entities Layer

### Responsibilities
- Define domain models as plain TypeScript classes or types.
- Include basic validation in constructors (e.g., required fields, no duplicates).
- Represent core business rules lightly (e.g., immutability via readonly).
- No dependencies on other layers or external libraries.

### Placement
Always in a dedicated `features/<feature>/entities/` folder.

### Rules
- Validate on creation to catch basic errors early (saves backend calls).
- Use `fromPlainObject` static methods for deserialization (e.g., from API DTOs).
- Throw centralized errors extending `DomainError` for validation failures.
- Keep simple: No complex logic; push to backend.

### Example: `features/notes/entities/Note.ts`
This example includes validation and a factory method. Copy-paste and adapt for your entity.

```typescript
import { ValidationError } from '../../../common/errors/DomainError';  // Centralized base error

export class Note {
    readonly id: string;
    readonly title: string;
    readonly instructions: string;
    readonly template: string;
    readonly category: string | null;
    readonly tags: readonly string[];

    constructor(
        id: string,
        title: string,
        instructions: string,
        template: string,
        category: string | null,
        tags: string[]
    ) {
        // Validate and assign properties
        this.validate(id, title, instructions, template, category, tags);
        
        this.id = id;
        this.title = title;
        this.instructions = instructions;
        this.template = template;
        this.category = category;
        this.tags = Object.freeze([...tags]) as readonly string[];
    }

    /**
     * Creates a Note instance from a plain object (for deserialization).
     * @throws {ValidationError} if validation fails
     */
    static fromPlainObject(data: {
        id: string;
        title: string;
        instructions: string;
        template: string;
        category: string | null;
        tags: string[];
    }): Note {
        return new Note(
            data.id,
            data.title,
            data.instructions,
            data.template,
            data.category,
            data.tags
        );
    }

    /**
     * Validates note properties according to domain rules.
     * @throws {ValidationError} if validation fails
     */
    private validate(
        id: string,
        title: string,
        instructions: string,
        template: string,
        category: string | null,
        tags: string[]
    ): void {
        const errors: string[] = [];

        if (!id?.trim()) errors.push('ID is required');
        if (!title?.trim()) errors.push('Title is required');
        if (!instructions?.trim()) errors.push('Instructions are required');
        if (!template?.trim()) errors.push('Template is required');
        if (category !== null && typeof category !== 'string') errors.push('Category must be a string or null');

        if (!Array.isArray(tags)) {
            errors.push('Tags must be an array');
        } else {
            const tagSet: Set<string> = new Set();
            for (const tag of tags) {
                if (typeof tag !== 'string') {
                    errors.push('All tags must be strings');
                    break;
                }
                if (tagSet.has(tag)) {
                    errors.push(`Duplicate tag: '${tag}'`);
                }
                tagSet.add(tag);
            }
        }

        if (errors.length > 0) {
            throw new ValidationError(errors.join('; '));
        }
    }
}
```

## Repositories Layer

### Responsibilities
- Abstract data access (e.g., CRUD operations).
- Map raw data (e.g., API DTOs) to domain entities.
- Handle errors from data sources (e.g., HTTP).
- Implementation-agnostic: Use a port for swapping (HTTP, mock, local storage).

### Placement
In `features/<feature>/repositories/`, with the port alongside implementations.

### Rules
- **Mandate Port**: Define `<Feature>RepositoryPort.ts` as an interface.
- Provide at least HTTP and mock implementations.
- DTOs: Define raw payload types here or in a `dto/` subfolder if complex. [TO BE DECIDED] for full conventions; principle: keep near mapping logic (e.g., in repository for API communication).
- Mapping: Done in repository (e.g., DTO to entity via `Entity.fromPlainObject`).
- Errors: Propagate or wrap as domain errors. [TO BE DECIDED] for transformation patterns.
- Mock: Every feature **should** provide a mock for tests and mock env (e.g., via bootstrap).

### Example: Port `features/notes/repositories/NoteRepositoryPort.ts`
Define the interface. Copy-paste for your feature's operations.

```typescript
import { Note } from "../entities/Note";

export interface NoteRepositoryPort {
    getNotes(): Promise<Note[]>;
    getNoteById(id: string): Promise<Note>;
    createNote(note: Note): Promise<void>;
    updateNote(note: Note): Promise<void>;
    deleteNote(id: string): Promise<void>;
}
```

### Example: Mock Implementation `features/notes/repositories/MockNoteRepository.ts`
Uses in-memory data. Include mock data helpers (e.g., in `tests/NoteMockData.ts`).

```typescript
import { Note } from "../entities/Note";
import { NoteNotFoundError } from "../../../common/errors/DomainError";
import type { NoteRepositoryPort } from "./NoteRepositoryPort";
import { mockData } from "../tests/NoteMockData";  // Helper with sample data

export class MockNoteRepository implements NoteRepositoryPort {
    private notes: Note[];
    private readonly _defaultNotes: Note[] = mockData.notes.map(note => Note.fromPlainObject(note));

    constructor(initialNotes: Note[] | undefined = undefined) {
        this.notes = initialNotes ?? this._defaultNotes;
    }

    getNotes(): Promise<Note[]> {
        return Promise.resolve(this.notes);
    }

    getNoteById(id: string): Promise<Note> {
        const note = this.notes.find(note => note.id === id) ?? null;
        if (note === null) {
            return Promise.reject(new NoteNotFoundError(id));
        }
        return Promise.resolve(note);
    }

    createNote(note: Note): Promise<void> {
        this.notes.push(note);
        return Promise.resolve();
    }

    updateNote(note: Note): Promise<void> {
        const index = this.notes.findIndex(p => p.id === note.id);
        if (index !== -1) {
            this.notes[index] = note;
        }
        return Promise.resolve();
    }

    deleteNote(id: string): Promise<void> {
        this.notes = this.notes.filter(note => note.id !== id);
        return Promise.resolve();
    }
}
```

### Example: HTTP Implementation `features/notes/repositories/HttpNoteRepository.ts`
Uses centralized `ApiClient`. Assumes no complex DTOs (direct mapping); add if needed.

```typescript
import { ApiClient } from "@/common/http/HttpClient";
import { Note } from "../entities/Note";
import type { NoteRepositoryPort } from "./NoteRepositoryPort";

export class HttpNoteRepository implements NoteRepositoryPort {
    constructor(
        private readonly apiClient: ApiClient
    ) {}

    getNotes(): Promise<Note[]> {
        return this.apiClient.get('/notes');
    }

    getNoteById(id: string): Promise<Note> {
        return this.apiClient.get(`/notes/${id}`);
    }

    createNote(note: Note): Promise<void> {
        return this.apiClient.post('/notes', note);
    }
    
    updateNote(note: Note): Promise<void> {
        return this.apiClient.put(`/notes/${note.id}`, note);
    }

    deleteNote(id: string): Promise<void> {
        return this.apiClient.delete(`/notes/${id}`);
    }
}
```

For DTOs (if backend response differs from entity): Define types like `interface NoteDto { ... }` here, then map: `Note.fromPlainObject(dto)` in methods.

## Services Layer

### Responsibilities
- Orchestrate use cases (e.g., combine repository calls).
- Frontend-specific logic (e.g., calculations, multi-step flows).
- Thin/pass-through when backend handles logic (common case).

### Placement
In `features/<feature>/services/`.

### Rules
- Depend on repository port (inject via constructor).
- No direct data access or HTTP; always via repository.
- Keep lean; delegate to backend for data-heavy ops.

### Example: `features/notes/services/NoteService.ts`
Thin facade injecting repository.

```typescript
import { Note } from "../entities/Note";
import type { NoteRepositoryPort } from "../repositories/NoteRepositoryPort";

export class NoteService {
    constructor(
        private readonly repository: NoteRepositoryPort
    ) {}

    async getNotes(): Promise<Note[]> {
        return this.repository.getNotes();
    }

    async getNoteById(id: string): Promise<Note> {
        return this.repository.getNoteById(id);
    }

    async createNote(note: Note): Promise<void> {
        return this.repository.createNote(note);
    }

    async updateNote(note: Note): Promise<void> {
        return this.repository.updateNote(note);
    }

    async deleteNote(id: string): Promise<void> {
        return this.repository.deleteNote(id);
    }
}
```

## Error Handling

[TO BE DECIDED] for full patterns (e.g., services wrapping repository errors). For now, recommend centralized, type-safe errors extending a base like `DomainError`. Example base file: `common/errors/DomainError.ts`.

```typescript
export class DomainError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DomainError';
    }
}

export class ValidationError extends DomainError {
    constructor(message: string, public readonly field?: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

// Add feature-specific, e.g.:
export class NoteNotFoundError extends DomainError {
    constructor(id: string) {
        super(`Note with id ${id} not found`);
        this.name = 'NoteNotFoundError';
    }
}

// ... more as in provided DomainError.ts
```

In repositories/services, throw these for consistency.

## Testing Conventions

- **Colocation**: Use `tests/` folders inside layers or at feature root (e.g., `features/notes/tests/` for services).
- **Naming**: `*.test.ts` (e.g., `NoteService.test.ts`).
- **Approach**: Services always tested against mock repository (real logic, controlled data). Use Vitest.
- Aspire to 100% coverage; mock only what's needed.

### Example: `features/notes/tests/NoteService.test.ts`
Comprehensive tests using mock repo.

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { NoteService } from '../services/NoteService';
import { MockNoteRepository } from '../repositories/MockNoteRepository';
import { Note } from '../entities/Note';
import { NoteNotFoundError } from '../../../common/errors/DomainError';
import { mockData } from './NoteMockData';  // Sample data

describe('NoteService', () => {
    let service: NoteService;
    let repository: MockNoteRepository;

    beforeEach(() => {
        repository = new MockNoteRepository();
        service = new NoteService(repository);
    });

    describe('getNotes', () => {
        it('should return array of notes from repository', async () => {
            const notes = await service.getNotes();
            
            expect(notes).toBeInstanceOf(Array);
            expect(notes.length).toBeGreaterThan(0);
            expect(notes[0]).toBeInstanceOf(Note);
        });

        it('should return empty array when repository has no notes', async () => {
            const emptyRepository = new MockNoteRepository([]);
            const emptyService = new NoteService(emptyRepository);
            
            const notes = await emptyService.getNotes();
            
            expect(notes).toEqual([]);
        });

        it('should return notes with correct structure', async () => {
            const notes = await service.getNotes();
            
            notes.forEach(note => {
                expect(note).toHaveProperty('id');
                expect(note).toHaveProperty('title');
                expect(note).toHaveProperty('instructions');
                expect(note).toHaveProperty('template');
                expect(note).toHaveProperty('category');
                expect(note).toHaveProperty('tags');
            });
        });
    });

    // ... (full test suite as in provided NoteService.test.ts; truncated for brevity)
    // Include tests for getNoteById, createNote, updateNote, deleteNote
});
```

### Example Mock Data Helper: `features/notes/tests/NoteMockData.ts`
```typescript
export const mockData = {
    notes: [
        {
            id: '1',
            title: 'Sample Note 1',
            instructions: 'Instructions 1',
            template: 'Template 1',
            category: 'category1',
            tags: ['tag1', 'tag2']
        },
        // Add more samples
    ]
};
```

## Bootstrap Integration

Core layers are wired in `features/<feature>/bootstrap.ts` (select real vs. mock repo based on config). Export from `index.ts`. See `fe-store-instructions.md` and `architecture.md` for full details.

### Example: `features/notes/bootstrap.ts`
```typescript
import { NoteService } from './services/NoteService'
import { MockNoteRepository } from './repositories/MockNoteRepository'
import { HttpNoteRepository } from './repositories/HttpNoteRepository'
import { ApiClient } from '@/common/http/HttpClient'
import { appConfig } from '@/common/env/AppConfig'
import { createNotesStore } from './store/NotesStore'
import notesRoutes from './routes'

const bootstrapNotes = () => {
    const useMocks = appConfig.isMockEnv

    const apiClient = new ApiClient(appConfig.baseUrl);
    const repository = useMocks
        ? new MockNoteRepository()
        : new HttpNoteRepository(apiClient)

    const service = new NoteService(repository)
  
    return {
        useStore: createNotesStore(service),
        routes: notesRoutes
    }
}

export { bootstrapNotes }
```

App-level: Aggregate in `app/bootstrap.ts`.

```typescript
// src/app/bootstrap.ts
import { Router } from 'vue-router'
import { bootstrapNotes } from '@/features/notes'  // Adapted path

export const bootstrapFeatures = (router: Router) : void => {   
    console.log('bootstrapFeatures, router: ', router);
    for (const route of bootstrapNotes().routes) {
        console.log('bootstrapFeatures, adding route: ', route.name);
        router.addRoute(route);
    }
}
```

## Additional Notes

- **Value Objects/Primitives**: If needed beyond main entity (e.g., `Money` type), place in `entities/`. [TO BE DECIDED] for naming.
- **Pivoting/Refactoring**: Layers enable quick changes (e.g., swap repo impl).
- Evolve this doc as needed; append for app/common layers.

This document aligns with our startup goals: Clear, testable, resilient. Follow strictly to avoid messes.