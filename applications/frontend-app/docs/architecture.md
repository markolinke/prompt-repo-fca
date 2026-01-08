# Frontend Architecture Guidelines

## Philosophy

Our frontend is **not** the place for complex business logic — that belongs on the backend.

The frontend's primary role is:

- To serve as a **delivery layer** (UI + state management)
- To communicate with backend services
- To handle **presentation logic** only

We follow a **Flat Clean Architecture** approach:  

- Combination of FSD (Feature-Sliced Design) and Clean Architecture (slice by domain, and inside every domain a "lightweight" clean architecture)
- We keep clean separation of concerns within each feature, but avoid deep folder nesting and heavy boilerplate.

**Core principles:**

- Single responsibility per file/folder
- Clear boundaries between layers
- Easy to mock and test
- **100% test coverage** — All code should have comprehensive test coverage
- Minimal cognitive load for developers and AI agents
- **Features are self-sufficient modules** with a single public entry point

## Flat Clean Architecture (per feature)

We apply Clean Architecture principles **locally within each feature**, not globally across the app.

Layers (from inner to outer):

| Layer              | Responsibility                                                                 | Technologies / Tools                     | Mockable? |
|--------------------|--------------------------------------------------------------------------------|------------------------------------------|-----------|
| **Domain**         | Business entities, value objects, core business rules                          | Plain TypeScript classes / types         | Yes       |
| **Data**           | Data access (API calls, mapping DTO → domain model)                            | Axios/fetch, repository pattern          | Yes       |
| **Application**    | Use cases / services (frontend-specific logic, calculations)                   | Plain TS functions or classes            | Yes       |
| **Presentation**   | UI components, views, state management                                         | Vue 3 components, Pinia, Composables     | Yes       |

## Frontend Application Structure

```text
applications/frontend-app/
├── src/
│   ├── app/                           # Vue root: App.vue, main.ts, router, global providers
│   │   ├── App.vue
│   │   ├── HelloWorld.vue
│   │   ├── bootstrap/
│   │   │   ├── bootstrapDependencies.ts
│   │   │   └── bootstrapFeatures.ts
│   │   ├── main.css
│   │   ├── main.ts
│   │   ├── router/
│   │   │   ├── MyRouter.ts
│   │   │   └── index.ts
│   │   ├── stores/
│   │   │   └── index.ts
│   │   └── style.css
│   ├── common/                         # Cross-cutting infrastructure (framework-agnostic)
│   │   ├── env/                        # Bootstrapping, config
│   │   │   └── AppDependencies.ts
│   │   ├── errors/                     # Type-safe errors
│   │   │   └── DomainError.ts
│   │   ├── http/                       # Http clients
│   │   │   ├── AxiosHttpClient.ts
│   │   │   └── HttpClientPort.ts
│   │   ├── time/                       # Time-related providers
│   │   │   ├── debouncer/              # UI debouncer (i.e. for search)
│   │   │   ├── time_provider/          # Time provider 
│   │   │   └── timeout/                # Timeout provider
│   │   ├── utils/                      # Common utils
│   │   │   └── FlagsUtil.ts
│   │   └── routing/                    # Router abstraction and implementation
│   │       └── MyRouterPort.ts
│   ├── ui/                             # Common UI controls (shared controls library)
│   │   ├── base/
│   │   │   └── ButtonWithLoader.ts
│   └── domains/                        # Feature-Sliced Design (FSD) modules
│       └── notes/                      # Example feature – self-contained module
│           ├── bootstrap.ts
│           ├── components/
│           │   └── NotesList.vue
│           ├── docs/
│           │   └── README.md
│           ├── entities/
│           │   └── Note.ts
│           ├── index.ts
│           ├── pages/
│           │   └── NotesPage.vue
│           ├── repositories/
│           │   ├── HttpNoteRepository.ts
│           │   ├── MockNoteRepository.ts
│           │   └── NoteRepositoryPort.ts
│           ├── routes.ts
│           ├── services/
│           │   └── NoteService.ts
│           ├── store/
│           │   └── NotesStore.ts
│           └── tests/
│               ├── NoteMockData.ts
│               └── NoteService.test.ts
├── public/
│   └── favicon.svg
├── index.html
├── docs/
│   ├── README.md
│   ├── architecture.md
│   ├── domain-core-layers.md
│   ├── frontend-store.md
│   └── vue-application.md
└── README.md
```

### Feature Bootstrapping

- Each feature **must** provide a `bootstrap<Feature>()` function exported from its `index.ts`.
- The bootstrap function wires the feature's dependencies (real vs. mock) based on environment or explicit options.
- It returns configured artifacts (e.g., pre-wired `useStore`, `routes`).
- This replaces centralized wiring and makes features plug-and-play.

Example bootstrap signature (from `domains/notes/bootstrap.ts`):

```typescript
import { NoteService } from './services/NoteService'
import { MockNoteRepository } from './repositories/MockNoteRepository'
import { HttpNoteRepository } from './repositories/HttpNoteRepository'
import { AxiosHttpClient } from '@/common/http/AxiosHttpClient'
import { appConfig } from '@/common/env/AppConfig'  // If using separate config; otherwise via AppDependencies
import { createNotesStore } from './store/NotesStore'
import notesRoutes from './routes'

const bootstrapNotes = () => {
    const useMocks = appConfig.isMockEnv  // Or via env detection

    const apiClient = new AxiosHttpClient(appConfig.baseUrl);
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

The root application aggregates features in `src/app/bootstrap/bootstrapFeatures.ts`:

```typescript
// src/app/bootstrap/bootstrapFeatures.ts
import { Router } from 'vue-router'
import { bootstrapNotes } from '@/domains/notes'

export const bootstrapFeatures = (router: Router) : void => {   
    console.log('bootstrapFeatures, router: ', router);
    for (const route of bootstrapNotes().routes) {
        console.log('bootstrapFeatures, adding route: ', route.name);
        router.addRoute(route);
    }
}
```

Global dependencies (e.g., router) are bootstrapped in `src/app/bootstrap/bootstrapDependencies.ts` and registered via `AppDependencies`.

## Layer Responsibilities & Rules

### Dependency Injection and Ports

- Use explicit ports/interfaces **only for layers that are frequently swapped** (e.g., repositories with `<Feature>RepositoryPort.ts`, HTTP client with `HttpClientPort.ts`).
- For services, rely on TypeScript's structural typing (duck typing). Do **not** create dedicated service port files unless a concrete need arises.
- Global dependencies (e.g., router, HTTP client config) are managed via `AppDependencies` singleton in `common/env/`.
- This keeps boilerplate minimal while maintaining type safety.

### Strict Rules (for developers & AI agents)

1. **No direct HTTP calls** from components, pages, stores, or services → always go through repositories (e.g., `Http<Feature>Repository` using `AxiosHttpClient` from `common/http/`).
2. **No domain logic** in repositories or stores → only in services or entities.
3. **All data access** must be done through a repository (implements port, with mock and HTTP variants).
4. **Pinia stores** may only call injected application services (never repositories directly).
5. **Feature bootstrapping**:
   - Every feature must export `bootstrap<Feature>()` from its barrel (`index.ts`)
   - Bootstrapping decides real vs. mock implementations based on `import.meta.env` or options
   - Central app only imports from feature barrels
   - Barrel (`index.ts`) exposes only what's intended externally (e.g., bootstrap function; [TO BE DECIDED] for types/services).
6. **Mocking**:
   - Repositories: Provide `Mock<Feature>Repository` for tests and mock env.
   - Services: Test against mock repositories.
   - HTTP: [TO BE DECIDED] for global MSW vs. per-feature.
7. **Tests**:
   - **100% test coverage** is the target for all code
   - Tests are colocated in each feature's `tests/` folder (e.g., `domains/notes/tests/`)
   - Use Vitest for unit tests (service layer) and integration tests (use case level)
   - Integration tests use real components + real store + real service + mock repository
   - Tests are organized by use case/user story, not by component
   - See `testing.md` for detailed testing guidelines and patterns
8. **Errors**: Generic errors in `common/errors/DomainError.ts`; feature-specific in the feature (e.g., entities or repositories).
9. **Validation**: Basic in entities; heavy on backend.
10. **DTOs**: Place in appropriate layer (e.g., repositories for API payloads); [TO BE DECIDED] for conventions.

## Recommended Tools

- **State management**: Pinia (with factory-based DI)
- **HTTP client**: Axios (via `AxiosHttpClient` in `common/http/`)
- **API mocking**: MSW or per-feature mock repositories
- **Testing**: Vitest + `@testing-library/vue`
- **Type safety**: TypeScript (strict mode)

This structure ensures features are modular, environment-aware, highly testable, and easy to onboard or extract. See `domain-core-layers.md` for entities/repositories/services details, `common-layer.md` for common infrastructure, `frontend-store.md` for store guidelines, and `testing.md` for comprehensive testing strategy and patterns.
