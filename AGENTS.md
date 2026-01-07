## AI Agent Guidelines for This Monorepo

This `AGENTS.md` describes how all agents should work in this repository. It is intentionally short, dense, and easy to change as the project evolves.

### Monorepo Structure (High-Level Mental Model)

- **Root workspace**
  - **`package.json` / `pnpm-workspace.yaml`**: define shared tooling and scripts
  - **`applications/`**: independent apps that share conventions and architecture
- **Applications**
  - **`applications/frontend-app/`**: Vue SPA using Flat Clean Architecture and Feature-Sliced Design (see its own `AGENTS.md` for app-specific rules)
  - Future apps should mirror the same principles: clear boundaries, feature-first structure, shared infra where it makes sense.

Think in terms of **features first**, **layers second**. Each app is a thin shell that wires domains, infrastructure, and UI.

### Clean Architecture (Project-Wide Principles)

- **Dependency direction**
  - **Outer layers depend on inner layers** (UI → store → services → repositories → HTTP/infrastructure).
  - Inner layers never import from outer layers (no domain code importing Vue, Pinia, or app-specific setup).
- **Domains as units of change**
  - Each domain is **self-contained**: entities, repositories, services, store, UI, routes, tests.
  - New behavior should ideally be added by extending a domain or adding a new one, not by scattering logic.
- **Ports and adapters**
  - Use **ports (interfaces / duck-typed shapes)** at boundaries (e.g., repositories talking to HTTP clients).
  - Implementations (HTTP, mocks, etc.) live at the edge and are wired via **bootstrap** functions.
- **Framework-agnostic core**
  - Entities, services, and repositories are **plain TypeScript** with no framework imports.
  - Application/framework concerns stay in app/bootstrap/router/store/component layers.

When unsure, follow the patterns used in `applications/frontend-app/src/domains/notes/` and generalize them.

### Clean Code (How to Write Code Here)

- **Clarity over cleverness**
  - Prefer **simple, explicit code** to abstractions that hide intent.
  - Optimize for junior devs and AI agents to understand the code quickly.
- **Small, focused modules**
  - Each file should have **one primary responsibility**.
  - Avoid long God-objects or multi-purpose files; extract helpers or sub-features when they emerge.
- **Naming and structure**
  - Names should describe **business meaning**, not just technical detail.
  - Keep domain language consistent across entities, services, repositories, and tests.
- **Side-effect boundaries**
  - Concentrate IO and side effects in clearly defined layers (repositories, HTTP clients, bootstrap wiring).
  - Keep business rules and transformations pure where possible.

Always ask: *“Would a new teammate understand this in a few minutes?”* If not, simplify or add a tiny bit of structure.

### TDD as Default Way of Working

- **TDD is the default**
  - Start from **behavior**: describe the user or domain scenario in tests first.
  - Implement the **simplest code** that makes the test pass, then refactor with safety.
- **Where tests live**
  - Follow each application’s testing guidelines (see `applications/frontend-app/docs/testing.md` for the frontend).
  - Prefer **use-case / workflow tests** over low-level implementation details.
- **Guardrail**
  - Before writing non-trivial production code, consider: *“What failing test will prove this is needed?”*

If TDD is temporarily impractical (e.g., spike code), treat it as **disposable** and plan to replace it with TDD-driven code.

### Hard Rules for AI Agents

- **NEVER modify tests without explicit human confirmation**
  - Do not create, delete, or edit any test files (unit, integration, E2E, fixtures, mock data) unless the human user has clearly asked for it.
  - If a change appears to require test updates, pause and **ask the user first**.
- **Respect per-application `AGENTS.md`**
  - Each app (e.g., `applications/frontend-app/AGENTS.md`) may define stricter local rules.
  - When there is overlap, **local app rules win** for that app.

When in doubt about structure, dependencies, or tests, **ask the user or mirror the existing patterns in the closest similar feature**.

