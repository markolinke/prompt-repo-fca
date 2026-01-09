# Team Note Repository (FCA)

A shared library of high-quality, reusable AI notes for our SaaS product team.  
Helps us work faster and more consistently in the age of AI by centralizing proven notes for design, architecture, coding, validation, and more.

## Flat Clean Architecture (FCA)

Flat Clean Architecture is a custom term for a combination of Domain Driven Design and Clean Architecture. In Short:

- This is a monorepo containing both backend services (in Python) and frontend applications (in Vue).
- The root structure divides into `applications/` (frontend apps), `services/` (backend microservices), `packages/` (shared libraries like types), and `docs/` (documentation).
- Applications and services are sliced into domains/features for modularity.
- Each domain follows a lightweight Clean Architecture: entities (business models), repositories (data access), services (use cases), with framework-specific layers integrated (e.g., stores, components for Vue).
- Backend services handle complex business logic; frontend focuses on presentation and client-side orchestration.

For detailed frontend guidelines, see `docs/architecture.md`, `docs/domain-core-layers.md`, `docs/common-layer.md`, and `docs/frontend-store.md`.

## Monorepo Design and Principles

### Design

- **Monorepo Benefits**: Single repository for all codebases enables shared tooling, consistent CI/CD, easier refactoring across services, and simplified dependency management.
- **Structure Overview**:
  - `applications/`: Contains frontend applications (e.g., `frontend-app/` with Vue codebase).
  - `services/`: Backend microservices (e.g., `auth-service/`, `invoice-service/` in Python).
  - `packages/`: Shared packages (e.g., `shared-types/` for TypeScript types reusable between FE and BE).
  - `docs/`: Central documentation for architecture, guidelines, and more.

#### Files Directory structure

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

### Principles

- **Modularity**: Slice by domains/features (e.g., `domains/notes/` in frontend) to keep concerns isolated and scalable.
- **Separation of Concerns**: Backend owns data-heavy logic and validation; frontend handles UI and lightweight orchestration.
- **Dependency Direction**: Inner layers (entities, repositories) are framework-agnostic; outer layers (stores, components) depend on them.
- **Testability**: Mandate mocks (e.g., repositories) and aim for high coverage.
- **Nimbleness**: Flat structure minimizes boilerplate; evolve via docs and bootstrapping for quick pivots.

## Getting Started

### Prerequisites

- Node.js 18+
- [pnpm](https://pnpm.io/) (preferred) or npm/yarn
- Python 3.10+ (for backend services)

### Installation

```bash
git clone https://github.com/your-org/team-note-repo.git
cd team-note-repo
pnpm install  # Installs frontend and shared packages; for backend, navigate to each service and run pip install
```

### Development

For frontend:

```bash
cd applications/frontend-app
pnpm dev
```

Open http://localhost:3000 (or your configured port).

For backend services:

- Navigate to a service (e.g., `cd services/auth-service`)
- Run development server (e.g., `python main.py` or as per service docs).

### Adding Notes (Coming Soon)

(Planned: simple form to add new notes with title, category, tags, template, and instructions.)

## Folder Structure (Example)

```text
team-note-repo/
├── applications/
│   └── frontend-app/                  # Vue frontend application
│       ├── src/
│       │   ├── app/                   # Vue root and bootstrap
│       │   ├── common/                # Shared infrastructure (HTTP, errors, etc.)
│       │   └── domains/               # Feature domains (e.g., notes/)
│       ├── public/
│       ├── docs/                      # Frontend-specific docs
│       └── README.md
├── services/
│   ├── auth-service/                  # Python backend microservice
│   ├── invoice-service/               # Another backend service
│   └── ...
├── packages/
│   └── shared-types/                  # Shared TS types between FE & BE
├── docs/                              # Monorepo-level docs (architecture.md, etc.)
└── README.md
```

## Mock Data Access

Both Frontend and Backend applications provide in-memory Mock data access. They support all CRUD operations and may be used for manual testing, and not only for automated testing.

Once running, the system provides a few mock repositories to run against:

- Frontend: Frontend supports mock and http repositories
  - Mock repositories are always used for automated testing, but can also be set altering the `.env.development` configuration file.
  - Mock login credentials are:
    - Email: `mock@ancorit.com`
    - Password: `LetMeIn!`
  - To reset: simply hard refresh page
- Backend: 
  - Backend provides different set of mock information, and is implemented as in-memory mock. 
  - Mock login credentials are:
    - Email: `john.doe@ancorit.com` (deliberately different from frontend mock credentials!)
    - Password: `LetMeIn!`
  - To reset: restart service

