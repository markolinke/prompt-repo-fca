# Frontend Application / Flat Clean Architecture

This document is the root document for Flat Clean Architecture frontend app.

Documentation for parts is described below:

## General information

### [architecture.md](docs/architecture.md)

High-level architecture overview and project structure. Describes the Flat Clean Architecture approach, feature organization, layer responsibilities, and dependency injection patterns. Start here to understand the overall system design.

## Application and Common (infra, utilities, error handling...)

### [common-layer.md](docs/common-layer.md)

The `src/common/` layer contains **pure, framework-agnostic infrastructure** that is shared across all features and the entire application. It is written exclusively in **plain TypeScript** — no Vue, Pinia, DOM APIs, or any other frontend framework dependencies are allowed.

## Domain-specific implementation layers

### [domain-core-layers.md](docs/domain-core-layers.md)

Guidelines for the core business logic layers: **Entities**, **Repositories**, and **Services**. Covers domain models, data access patterns, repository ports, service orchestration, validation, error handling, and testing conventions. These layers are framework-agnostic (pure TypeScript).

### [frontend-store.md](docs/frontend-store.md)

Pinia store layer guidelines. Explains reactive state management, dependency injection via factory functions, feature bootstrapping integration, and testing strategies. Stores act as the reactive facade between UI components and application services.

### [vue-application.md](docs/vue-application.md)

Vue 3 component development guidelines. Covers component structure, store integration patterns, routing, template conventions, lifecycle hooks, and composition API best practices. Defines the presentation layer rules and what components should and should not do.

### [testing.md](docs/testing.md)

Testing guidelines and best practices. Describes our use case-based integration testing approach, test organization patterns, bootstrap mocking for test isolation, and strategies for reducing flakiness. Covers both unit tests (service layer) and integration tests (user workflows) with real components, stores, and services using mock repositories.
