# Common Layer Guidelines

## Philosophy

The `src/common/` layer contains **pure, framework-agnostic infrastructure** that is shared across all features and the entire application. It is written exclusively in **plain TypeScript** — no Vue, Pinia, DOM APIs, or any other frontend framework dependencies are allowed.

The purpose of this layer is to:

- Standardize recurring cross-cutting concerns (HTTP client, routing abstraction, error types, dependency registry, configuration, etc.).
- Provide a stable, reusable foundation that features can depend on.
- Enable easy swapping, mocking, and testing of infrastructure components.
- Support our startup goals: maximum clarity, testability, quick pivoting, and long-term resilience.

The common layer follows Clean Architecture principles as the **infrastructure** concern but remains intentionally lightweight.

**Key Rule**: Dependency direction is **one-way only** — features and `app/` may import from `common/`, but `common/` **must never** import from features, domains, or `app/`.

## Core Principles

- **Plain TypeScript only** – No framework-specific code.
- **No UI or presentation logic** – No components, styles, or DOM manipulation.
- **No feature-specific logic** – Only generic, reusable concerns.
- **One-way dependencies** – `common/` must not import from any feature or `app/`.
- **Port & Adapter pattern** for external concerns (HTTP, routing, etc.).
- **Singleton dependency registry** (`AppDependencies`) instead of framework-specific injection.
- **Lowercase subfolder names** (e.g., `http/`, `errors/`).
- **Clarity first** – Naming, structure, and responsibilities must be self-explanatory.

## Project Structure

```
src/common/
├── env/
│   └── AppDependencies.ts         # Global singleton dependency registry
├── errors/
│   └── DomainError.ts             # Generic cross-cutting error types
├── http/
│   ├── HttpClientPort.ts          # HTTP abstraction
│   └── AxiosHttpClient.ts         # Current Axios implementation
├── routing/
│   └── MyRouterPort.ts            # Router abstraction
└── ...                            # Future growth: logging/, utils/, types/, analytics/, auth/
```

## Allowed vs. Forbidden Content

| Allowed                                         | Forbidden                                              |
|-------------------------------------------------|--------------------------------------------------------|
| Pure TS utilities, constants, type guards       | Any Vue / Pinia / DOM imports                          |
| Configuration access                            | UI components or styles                                |
| Generic error hierarchy                         | Feature-specific business logic or errors              |
| HTTP client port and implementations             | Direct imports from features or app/                   |
| Routing port                                    | Presentation-layer concerns                            |
| Singleton dependency registry                   | Framework-specific provide/inject                      |

## Dependency Injection Strategy

Use the **singleton `AppDependencies`** class for all global infrastructure dependencies.

- Avoids framework-specific injection mechanisms.
- Keeps core and common layers completely agnostic to Vue.
- Registered once during app bootstrap (`main.ts` or `app/bootstrap`).

### Example: `src/common/env/AppDependencies.ts`

```typescript
import type { MyRouterPort } from "../routing/MyRouterPort";
// Future ports: LoggerPort, AnalyticsPort, etc.

class AppDependencies {
    private myRouter: MyRouterPort | null = null;
    // private logger: LoggerPort | null = null;

    registerMyRouter(router: MyRouterPort): void {
        this.myRouter = router;
    }

    getMyRouter(): MyRouterPort {
        if (!this.myRouter) {
            throw new Error('MyRouter has not been registered. Call registerMyRouter() during app initialization.');
        }
        return this.myRouter;
    }

    // Future getters...
}

export const appDependencies = new AppDependencies();
```

## HTTP Client

All HTTP communication is abstracted behind a port. Current implementation uses Axios.

- Mocking strategy: [TO BE DECIDED] – either global MSW or per-feature mock repositories.
- For now, features provide their own `Mock<Feature>Repository`.

### Port: `src/common/http/HttpClientPort.ts`

```typescript
export interface HttpClientPort {
    get<T = any>(endpoint: string, params?: any, signal?: AbortSignal): Promise<T>;
    post<T = any>(endpoint: string, data?: any, signal?: AbortSignal): Promise<T>;
    put<T = any>(endpoint: string, data?: any, signal?: AbortSignal): Promise<T>;
    delete<T = any>(endpoint: string, data?: any): Promise<T>;
    // uploadFile, patch, etc. can be added later
}
```

### Current Implementation: `src/common/http/AxiosHttpClient.ts`

```typescript
import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import {
    HttpError,
    UnauthorizedError,
    NotFoundError,
    ForbiddenError,
    InternalServerError,
} from "../errors/DomainError";
import type { MyRouterPort } from "../routing/MyRouterPort";
import { appDependencies } from "../env/AppDependencies";
import type { HttpClientPort } from "./HttpClientPort";

export class AxiosHttpClient implements HttpClientPort {
    private get myRouter(): MyRouterPort {
        return appDependencies.getMyRouter();
    }

    constructor(
        private readonly baseUrl: string,
        private readonly headers: Record<string, string> = {},
        private readonly authToken: string = ""
    ) {}

    async get<T = any>(endpoint: string = "", params?: any, signal?: AbortSignal): Promise<T> {
        return this.request("get", endpoint, { params, signal });
    }

    async post<T = any>(endpoint: string = "", data?: any, signal?: AbortSignal): Promise<T> {
        return this.request("post", endpoint, { data, signal });
    }

    async put<T = any>(endpoint: string = "", data?: any, signal?: AbortSignal): Promise<T> {
        return this.request("put", endpoint, { data, signal });
    }

    async delete<T = any>(endpoint: string = "", data?: any): Promise<T> {
        return this.request("delete", endpoint, { data });
    }

    private async request<T>(method: string, endpoint: string, config: any = {}): Promise<T> {
        try {
            const client = this.createClient();
            const response = await (client as any)[method](endpoint, config.data || config);
            return response.data as T;
        } catch (error: any) {
            throw this.handleError(error);
        }
    }

    private createClient(): AxiosInstance {
        const config: AxiosRequestConfig = {
            baseURL: this.baseUrl,
            headers: this.headers,
        };

        if (this.authToken) {
            config.headers = { ...config.headers, Authorization: `Bearer ${this.authToken}` };
        }

        return axios.create(config);
    }

    private handleError(error: any): never {
        if (error.response) {
            const status = error.response.status;
            const message = error.response.data || error.message;

            switch (status) {
                case 401: throw new UnauthorizedError(message);
                case 403: throw new ForbiddenError(message);
                case 404: throw new NotFoundError(message);
                case 500: throw new InternalServerError(message);
                default: throw new HttpError(message);
            }
        }
        throw new HttpError(error.message || "Network error");
    }
}
```

## Error Hierarchy

**Only generic, cross-cutting errors** belong in `common/errors/`.

Feature-specific errors (e.g., `NoteNotFoundError`, `DuplicateNoteError`) **must** live in the owning feature (e.g., `domains/notes/entities/` or `repositories/`).

### Example: `src/common/errors/DomainError.ts`

```typescript
export class DomainError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "DomainError";
    }
}

export class ValidationError extends DomainError {
    constructor(message: string, public readonly field?: string) {
        super(message);
        this.name = "ValidationError";
    }
}

export class HttpError extends DomainError {
    constructor(message: string) {
        super(message);
        this.name = "HttpError";
    }
}

export class UnauthorizedError extends DomainError {
    constructor(message: string) {
        super(message);
        this.name = "UnauthorizedError";
    }
}

export class NotFoundError extends DomainError {
    constructor(message: string) {
        super(message);
        this.name = "NotFoundError";
    }
}

export class ForbiddenError extends DomainError {
    constructor(message: string) {
        super(message);
        this.name = "ForbiddenError";
    }
}

export class InternalServerError extends DomainError {
    constructor(message: string) {
        super(message);
        this.name = "InternalServerError";
    }
}
```

## Routing Abstraction

Abstracts the underlying router (currently Vue Router) behind a minimal port.

The port will grow incrementally as new needs arise.

### Example: `src/common/routing/MyRouterPort.ts`

```typescript
export interface MyRouterPort {
    navigateTo(route: object): void;
    // Future methods will be added here (e.g., goBack, getCurrentRoute)
}
```

## Future Growth

This layer is expected to expand with the following subfolders (guidelines will be added later):

- `logging/` – Logger abstraction
- `utils/` – Date, string, number utilities and type guards
- `types/` – Shared primitive types (ID, Email, Money, etc.)
- `analytics/` – Event tracking abstraction
- `auth/` – Token storage/refresh (if not a dedicated feature)

[TO BE DECIDED]: Detailed conventions for new subfolders.

## Testing the Common Layer

[TO BE CONSIDERED]: Unit testing strategy, test placement, and coverage requirements for `common/`.

Follow these guidelines strictly to preserve clarity, separation of concerns, and ease of evolution as the application grows.