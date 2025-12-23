# Team Prompt Repository (FCA)

A shared library of high-quality, reusable AI prompts for our SaaS product team.  
Helps us work faster and more consistently in the age of AI by centralizing proven prompts for design, architecture, coding, validation, and more.

## Flat Clean Architecture (FCA)

Flat Clean Architecture is a custom term for a combination of a Domain Driven Design and Clean Architecture. In Short:

- This is a monorepo, with both backend services (in `Pytnon`) and frontend applications (in `Vue`)
- The first level in the structure are `applications` or `services`
- Next, we slice the projects similar to FSD containing domains/ directory
- Domains are implemented in the `domains/` directory
- In the `Frontend app`, each domain has both `Clean Architecture` style and `Framework` layers (Vue/React...)
- CA directories/layers:
  - `entities/` (Business Objects/types)
  - `services/` (Business rules implementation, use cases or stories)
  - `repository/` (repo interface and implementation, local data objects/storage)
  - `api/` (Services access services)
- Framework directories/layers:
  - `store/` (state objects, such as Pinia store)
  - `components/` (UI components, i.e. InvoiceStatusDisplay)
  - `views/` (Page-level components)

## Getting Started

### Prerequisites

- Node.js 18+
- [pnpm](https://pnpm.io/) (preferred) or npm/yarn

### Installation

```bash
git clone https://github.com/your-org/team-prompt-repo.git
cd team-prompt-repo
pnpm install
```

### Development

```bash
pnpm dev
```

Open http://localhost:3000 (or your configured port).

### Adding Prompts (Coming Soon)

(Planned: simple form to add new prompts with title, category, tags, template, and instructions.)

## Folder Structure (Example)

```
team-prompt-repo/
├── src/
│   ├── components/         # UI components (PromptCard, FilterBar, etc.)
│   ├── data/               # prompts.json or database connection
│   ├── lib/                # utilities (copy-to-clipboard, filtering logic)
│   ├── pages/              # Next.js pages or app router
│   └── types/              # TypeScript interfaces (Prompt)
├── public/
└── README.md
```

## Contributing

1. Fork the repo
2. Create a branch: `git checkout -b feature/add-prompt-form`
3. Commit your changes
4. Open a pull request

# Frontend Architecture Guidelines

## Philosophy

Our frontend is **not** the place for complex business logic — that belongs on the backend.

The frontend's primary role is:

- To serve as a **delivery layer** (UI + state management)
- To communicate with backend services
- To handle **presentation logic** only

We follow a **Flat Clean Architecture** approach:  

- Combination of FSD and Clean Architecture (slice by domain, and inside every domain a "lightweight" clean architecture)
- We keep clean separation of concerns within each feature, but avoid deep folder nesting and heavy boilerplate.

**Core principles:**

- Single responsibility per file/folder
- Clear boundaries between layers
- Easy to mock and test
- Minimal cognitive load for developers and AI agents

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
│   ├── features/                      # Feature-Sliced Design (FSD) modules
│   │   ├── invoice/                   # Example feature
│   │   ├── customer/
│   │   ├── payment/
│   │   └── shared/                    # Cross-feature functionality (auth, notifications...)
│   ├── common/                        # Reusable UI components, utilities, hooks
│   │   ├── ui/                        # Button, Modal, DataTable...
│   │   ├── utils/
│   │   ├── hooks/
│   │   ├── types/
│   │   ├── infrastructure/                # Global infrastructure (axios instance, auth, error handling)
│   │   ├── api/                           # Optional: central API client / openapi generated clients
│   │   └── types/                         # Global shared types (ID, Money, DateTime...)
├── public/
├── tests/                             # Optional: e2e / global setup
├── docs/                              # Project documentation
└── package.json
```

## Feature Structure (Flat Clean Architecture)

Example: `features/invoice/`

```text
features/invoice/
├── api/                               # HTTP layer – raw DTOs
│   ├── invoiceApi.ts
│   ├── types.ts                       # InvoiceDto, ConfirmInvoiceRequest...
│   └── tests/                         # Optional
├── repository/                        # Data layer – maps DTO → domain model
│   ├── InvoiceRepository.ts
│   ├── types.ts                       # Invoice, InvoiceItem (domain models)
│   └── tests/                         # Optional
├── services/                          # Application layer – frontend business logic
│   ├── invoiceService.ts
│   └── tests/                         # Optional
├── store/                             # Presentation layer – Pinia store
│   └── invoiceStore.ts
│   └── tests/                         # Optional
├── components/                        # Feature-specific Vue components
│   └── InvoiceItem.vue
├── views/                             # Page-level components
│   ├── InvoiceListView.vue
│   └── InvoiceDetailView.vue
├── entities/                          # Feature-specific types (if not in api/repository)
│   └── entities.ts                    # Invoice, InvoiceItem...
├── tests/                             # integration tests
└── index.ts                           # barrel file
```

## Layer Responsibilities & Rules

| Folder            | What goes here?                                                                 | What does NOT go here?                                   |
|-------------------|---------------------------------------------------------------------------------|----------------------------------------------------------|
| `api/`            | Axios/fetch calls, raw DTO types, API contracts                                 | Domain logic, mapping, UI state                          |
| `repository/`     | Mapping DTO → domain model, repository pattern (plain TS class or functions)    | HTTP calls, UI state, business calculations              |
| `services/`       | Frontend-specific business logic (formatting, calculations, validations)        | HTTP calls, state management                             |
| `store/`          | Pinia modules – state, actions, getters                                         | Direct HTTP calls, domain mapping, Business objects      |
| `components/`     | Reusable or feature-specific Vue components                                     | Business logic, API calls                                |
| `views/`          | Page-level components (usually use store + services)                            | Direct API calls (go through store)                      |
| `entities/`       | Business objects in plain Typescript (Invoice, InvoiceReturn)                   | API Request types, helper object types, store items...   |
| `tests/`          | End-to-end tests / Integration tests                                            | Unit tests. Anything else                                |

### Strict Rules (for developers & AI agents)

1. **No direct HTTP calls** from components, views, or stores → always go through `repository/`
2. **No domain logic** in `api/` or `store/` → only in `services/` or `repository/`
3. **All data access** must be done through a repository
4. **Pinia stores** may only call repositories or services
5. **Mocking**:
   - `api/` → use MSW (Mock Service Worker)
   - `repository/` → mock the entire repository class/function
6. **Tests** → place in `tests/` inside each folder (colocation)

## Recommended Tools

- **State management**: Pinia
- **HTTP client**: Axios (with central instance in `infrastructure/api/`)
- **API mocking**: MSW (Mock Service Worker)
- **Testing**: Vitest + `@testing-library/vue`
- **Type safety**: TypeScript (strict mode)

## Example Workflow (Invoice Creation)

1. `InvoiceCreateView.vue` → calls `useInvoiceStore().createInvoice(data)`
2. `invoiceStore.ts` → calls `InvoiceRepository.create(data)`
3. `InvoiceRepository.create` → calls `invoiceApi.create(payload)`
4. `invoiceApi.create` → makes HTTP POST request
5. Response DTO → mapped to domain `Invoice` in repository
6. Returned to store → updates UI state

This ensures **clear separation** and **easy mocking/testing**.
