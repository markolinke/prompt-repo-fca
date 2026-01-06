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

## Project Structure (Monorepo)

```text
monorepo-root/
├── applications/
│   └── frontend-app/                  # Vue 3 frontend application
│       └── ... (see below)
├── services/
│   ├── auth-service/                  # Python backend microservices
│   ├── invoice-service/
│   └── ...
├── packages/
│   └── shared-types/                  # Optional: shared TS types between FE & BE
└── docs/
    └── architecture.md                # This file
```

## Frontend Application Structure

```text
applications/frontend-app/
├── src/
│   ├── app/                           # Vue root: App.vue, main.ts, router, global providers
│   ├── domains/                       # Feature-Sliced Design (FSD) modules
│   │   ├── invoice/                   # Example feature – self-contained module
│   │   ├── customer/
│   │   ├── payment/
│   │   └── shared/                    # Cross-feature functionality (auth, notifications...)
│   ├── common/                        # Standardization of patterns, i.e. common errors, interfaces. NOT tied to framework!
│   │   ├── errors/                    # Errors standardization...
│   │   ├── http/                      # Rest client interfaces
│   │   ├── env/                       # appDependencies, config...
│   │   └── routing/                   # routing abstraction (i.e. vue router is implementation)
│   ├── common-ui/                     # Global infrastructure (axios instance, auth, error handling)
│   │   ├── components/                # Common components (buttons, links...)
│   │   └── tests/                     # tests for the common components
├── public/
├── tests/                             # Optional: e2e / global setup
├── docs/                              # Project documentation
└── package.json
```

## Feature Structure (Flat Clean Architecture + Self-Bootstrapping)

Each feature is a **self-sufficient module** with a single public entry point: the barrel file `index.ts`.

Example: `features/invoice/`

```text
features/invoice/
├── index.ts                           # Public barrel – single entry point for the feature
├── bootstrap.ts                       # Internal: bootstraps the feature based on env/config
├── api/                               # HTTP layer – raw DTOs
│   ├── invoiceApi.ts
│   ├── types.ts
│   └── tests/
├── repository/                        # Data layer – maps DTO → domain model
│   ├── InvoiceRepository.ts
│   ├── InvoiceRepositoryPort.ts       # Optional port for DI (recommended for repositories)
│   ├── types.ts
│   └── tests/
├── services/                          # Application layer – frontend business logic
│   ├── InvoiceService.ts
│   ├── MockInvoiceService.ts          # For testing / mock env
│   └── tests/
├── store/                             # Presentation layer – Pinia store
│   ├── invoiceStore.ts                # Factory function createInvoiceStore(deps)
│   └── tests/
├── components/                        # Feature-specific Vue components
│   └── InvoiceItem.vue
├── views/                             # Page-level components
│   ├── InvoiceListView.vue
│   └── InvoiceDetailView.vue
├── routes.ts                          # Feature routes (optional separate file)
├── entities/                          # Feature-specific domain types (if needed)
│   └── entities.ts
└── tests/                             # Feature integration tests
```

### Feature Bootstrapping

- Each feature **must** provide a `bootstrap<Feature>()` function exported from its `index.ts`.
- The bootstrap function wires the feature's dependencies (real vs. mock) based on environment or explicit options.
- It returns configured artifacts (e.g., pre-wired `useStore`, `routes`).
- This replaces centralized wiring (e.g., old `storeProviders.ts`) and makes features plug-and-play.

Example bootstrap signature:
```typescript
export function bootstrapInvoice(options?: { useMocks?: boolean }): {
  useStore: () => PiniaStore
  routes: RouteRecordRaw[]
}
```

The root application aggregates features in `src/main.ts` or a dedicated `src/app/bootstrap.ts`:
```typescript
import { bootstrapInvoice } from '@/features/invoice'
import { bootstrapCustomer } from '@/features/customer'

const { useStore: useInvoiceStore, routes: invoiceRoutes } = bootstrapInvoice()
const { useStore: useCustomerStore, routes: customerRoutes } = bootstrapCustomer()

app.use(createPinia())
router.addRoute({ path: '/', children: [...invoiceRoutes, ...customerRoutes] })
```

## Layer Responsibilities & Rules

### Dependency Injection and Ports

- Use explicit ports/interfaces **only for layers that are frequently swapped** (e.g., repositories, where we inject real vs. mock implementations into services).
- For services, rely on TypeScript's structural typing (duck typing). Do **not** create dedicated service port files unless a concrete need arises (e.g., multiple service variants).
- This keeps boilerplate minimal while maintaining type safety.

### Strict Rules (for developers & AI agents)

1. **No direct HTTP calls** from components, views, or stores → always go through `repository/`
2. **No domain logic** in `api/` or `store/` → only in `services/` or `repository/`
3. **All data access** must be done through a repository
4. **Pinia stores** may only call injected application services (never repositories directly)
5. **Feature bootstrapping**:
   - Every feature must export `bootstrap<Feature>()` from its barrel (`index.ts`)
   - Bootstrapping decides real vs. mock implementations based on `import.meta.env` or options
   - Central app only imports from feature barrels
6. **Mocking**:
   - `api/` → use MSW
   - `repository/` and `services/` → mock entire classes via bootstrap options or test factories
7. **Tests** → colocated in each layer's `tests/` folder

## Recommended Tools

- **State management**: Pinia (with factory-based DI)
- **HTTP client**: Axios (central instance in `infrastructure/`)
- **API mocking**: MSW
- **Testing**: Vitest + `@testing-library/vue`
- **Type safety**: TypeScript (strict mode)

This structure ensures features are modular, environment-aware, highly testable, and easy to onboard or extract.
