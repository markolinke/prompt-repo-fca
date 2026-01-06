# Frontend Application / Flat Clean Architecture

This document is the root document for Flat Clean Architecture frontend app.

Documentation for parts is described below:

## Documentation Files

### [architecture.md](./architecture.md)

High-level architecture overview and project structure. Describes the Flat Clean Architecture approach, feature organization, layer responsibilities, and dependency injection patterns. Start here to understand the overall system design.

### [domain-core-layers.md](./domain-core-layers.md)

Guidelines for the core business logic layers: **Entities**, **Repositories**, and **Services**. Covers domain models, data access patterns, repository ports, service orchestration, validation, error handling, and testing conventions. These layers are framework-agnostic (pure TypeScript).

### [frontend-store.md](./frontend-store.md)

Pinia store layer guidelines. Explains reactive state management, dependency injection via factory functions, feature bootstrapping integration, and testing strategies. Stores act as the reactive facade between UI components and application services.

### [vue-application.md](./vue-application.md)

Vue 3 component development guidelines. Covers component structure, store integration patterns, routing, template conventions, lifecycle hooks, and composition API best practices. Defines the presentation layer rules and what components should and should not do.
