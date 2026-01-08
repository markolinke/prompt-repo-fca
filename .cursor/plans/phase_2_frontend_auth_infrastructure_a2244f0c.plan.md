---
name: "Phase 2: Frontend Auth Infrastructure"
overview: Create frontend authentication domain structure following Clean Architecture, implementing auth store, service, repository, and UI components. Token injection handled via getToken function parameter in AxiosHttpClient constructor, keeping it thin and framework-agnostic.
todos:
  - id: user-entity
    content: Create User entity matching backend structure
    status: completed
  - id: auth-repository-port
    content: Create AuthRepositoryPort interface
    status: completed
  - id: auth-repository
    content: Create HttpAuthRepository implementation
    status: completed
  - id: auth-service
    content: Create AuthService with business logic
    status: completed
  - id: auth-store
    content: Create AuthStore (Pinia) with factory pattern
    status: completed
  - id: update-axios-client
    content: Modify AxiosHttpClient to accept getToken function instead of static authToken
    status: completed
  - id: update-bootstrap-deps
    content: Update bootstrapDependencies to create base client without token
    status: completed
  - id: auth-bootstrap
    content: Create auth bootstrap that wires dependencies and creates authenticated client
    status: completed
  - id: login-page
    content: Create LoginPage component with mock login UI
    status: completed
  - id: auth-routes
    content: Create auth routes configuration
    status: completed
  - id: route-guards
    content: Add route guards structure (non-enforcing in Phase 2)
    status: completed
  - id: update-bootstrap-features
    content: Register auth routes in bootstrapFeatures
    status: completed
---

# Phase 2: Frontend Auth Infrastructure Implementation

## Overview

Phase 2 sets up the frontend authentication infrastructure to prepare for Phase 3 (real JWT integration). This builds the architecture without real OAuth yet - just the structure and mock authentication flow.

## Architecture Decisions

### Token Injection Strategy

Following Clean Architecture principles:

- **`AxiosHttpClient`** remains a thin wrapper around axios - modified to accept optional `getToken?: () => string | null` function instead of static `authToken: string`
- This is still "thin" - just wiring, no business logic
- Business logic (when to get token, what token means) stays in auth domain
- Repositories that need auth receive an `AxiosHttpClient` instance created with a `getToken` function
- Repositories that don't need auth receive an `AxiosHttpClient` instance created without `getToken` (or with `undefined`)

This keeps HTTP client swappable (for MSW, testing, or other implementations) while auth concerns stay in the auth domain.

## Implementation Structure

### New Files to Create

```javascript
applications/frontend-app/src/domains/auth/
├── entities/
│   └── User.ts                    # User entity matching backend
├── repositories/
│   ├── AuthRepositoryPort.ts     # Interface for auth API calls
│   └── HttpAuthRepository.ts     # HTTP implementation
├── services/
│   └── AuthService.ts            # Business logic (login, logout, getCurrentUser)
├── store/
│   └── AuthStore.ts              # Pinia store (user state, token)
├── components/
│   └── LoginPage.vue             # Login page UI (structure only for Phase 2)
├── routes.ts                     # Auth routes (login page)
└── bootstrap.ts                  # Bootstrap function
```



### Files to Modify

1. **[applications/frontend-app/src/common/http/AxiosHttpClient.ts](applications/frontend-app/src/common/http/AxiosHttpClient.ts)**

- Change constructor parameter from `authToken: string = ""` to `getToken?: () => string | null`
- Update `createClient()` to call `getToken?.()` dynamically

2. **[applications/frontend-app/src/app/bootstrap/bootstrapDependencies.ts](applications/frontend-app/src/app/bootstrap/bootstrapDependencies.ts)**

- Update to create base HTTP client without token (pass `undefined` for `getToken`)

3. **[applications/frontend-app/src/app/bootstrap/bootstrapFeatures.ts](applications/frontend-app/src/app/bootstrap/bootstrapFeatures.ts)**

- Add `bootstrapAuth()` call to register auth routes

4. **[applications/frontend-app/src/app/router/index.ts](applications/frontend-app/src/app/router/index.ts)**

- Add route guards (non-enforcing in Phase 2 - structure only)

## Implementation Details

### 1. User Entity (`domains/auth/entities/User.ts`)

Match backend User entity structure:

```typescript
export class User {
    readonly id: string;
    readonly email: string;
    readonly name: string;

    constructor(id: string, email: string, name: string) {
        this.id = id;
        this.email = email;
        this.name = name;
    }

    static fromPlainObject(data: {
        id: string;
        email: string;
        name: string;
    }): User {
        return new User(data.id, data.email, data.name);
    }
}
```



### 2. AuthRepositoryPort (`domains/auth/repositories/AuthRepositoryPort.ts`)

Interface for auth API calls:

```typescript
import { User } from "../entities/User";

export interface AuthRepositoryPort {
    getCurrentUser(): Promise<User>;
    // Phase 3: login(), logout() will be added here
}
```



### 3. HttpAuthRepository (`domains/auth/repositories/HttpAuthRepository.ts`)

Uses `HttpClientPort` (which will be an `AxiosHttpClient` with token provider):

```typescript
import type { HttpClientPort } from "@/common/http/HttpClientPort";
import type { AuthRepositoryPort } from "./AuthRepositoryPort";
import { User } from "../entities/User";

export class HttpAuthRepository implements AuthRepositoryPort {
    constructor(private readonly httpClient: HttpClientPort) {}

    async getCurrentUser(): Promise<User> {
        const data = await this.httpClient.get('/auth/me');
        return User.fromPlainObject(data);
    }
}
```



### 4. AuthService (`domains/auth/services/AuthService.ts`)

Business logic layer:

```typescript
import type { AuthRepositoryPort } from "../repositories/AuthRepositoryPort";
import { User } from "../entities/User";

export class AuthService {
    constructor(private readonly repository: AuthRepositoryPort) {}

    async getCurrentUser(): Promise<User> {
        return this.repository.getCurrentUser();
    }

    // Phase 3: login(), logout() will be added here
}
```



### 5. AuthStore (`domains/auth/store/AuthStore.ts`)

Pinia store following the factory pattern (like NotesStore):

```typescript
import { defineStore } from 'pinia';
import { User } from '../entities/User';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
}

type AuthServiceShape = {
    getCurrentUser(): Promise<User>;
};

export const createAuthStore = (authService: AuthServiceShape) => {
    return defineStore('auth', {
        state: (): AuthState => ({
            user: null,
            token: null,
            isAuthenticated: false,
            loading: false,
            error: null,
        }),

        actions: {
            async fetchCurrentUser(): Promise<void> {
                this.loading = true;
                this.error = null;
                try {
                    this.user = await authService.getCurrentUser();
                    // Phase 2: Set mock token for now
                    this.token = 'mock-token';
                    this.isAuthenticated = true;
                } catch (error) {
                    this.error = error instanceof Error ? error.message : 'Failed to fetch user';
                    this.isAuthenticated = false;
                } finally {
                    this.loading = false;
                }
            },

            logout(): void {
                this.user = null;
                this.token = null;
                this.isAuthenticated = false;
            },
        },

        getters: {
            // Getter that returns a function for token retrieval
            getToken: (state): (() => string | null) => {
                return () => state.token;
            },
        },
    });
};
```



### 6. Update AxiosHttpClient (`common/http/AxiosHttpClient.ts`)

Modify constructor to accept token provider function:

```typescript
export class AxiosHttpClient implements HttpClientPort {
    constructor(
        private readonly baseUrl: string,
        private readonly headers: Record<string, string> = {},
        private readonly getToken?: () => string | null,  // Changed from authToken: string = ""
        private readonly router: MyRouterPort
    ) { }

    private createClient(params: object = {}): AxiosInstance {
        const config: AxiosRequestConfig = {
            baseURL: this.baseUrl,
            headers: this.headers,
            params: params
        };
        const token = this.getToken?.();  // Dynamic token retrieval at request time
        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }
        return axios.create(config);
    }
    
    // ... rest of methods unchanged
}
```



### 7. Update bootstrapDependencies (`app/bootstrap/bootstrapDependencies.ts`)

Create base HTTP client without token:

```typescript
export const bootstrapDependencies = (router: Router): void => {
    const appConfig = bootstrapAppConfig();

    const myRouter = new MyRouter(router);
    appDependencies.registerMyRouter(myRouter);

    // Create base HTTP client without token (for non-auth repositories)
    const httpClient = new AxiosHttpClient(
        appConfig.baseUrl, 
        {}, 
        undefined,  // No token provider - repositories that need auth will get their own client
        myRouter
    );
    appDependencies.registerHttpClient(httpClient);

    const timeoutClient = new BrowserTimeout();
    appDependencies.registerTimeoutClient(timeoutClient);
};
```



### 8. Auth Bootstrap (`domains/auth/bootstrap.ts`)

Wire dependencies and create authenticated HTTP client:

```typescript
import { AuthService } from './services/AuthService';
import { HttpAuthRepository } from './repositories/HttpAuthRepository';
import { createAuthStore } from './store/AuthStore';
import authRoutes from './routes';
import { appDependencies } from "@/common/env/AppDependencies";
import { AxiosHttpClient } from '@/common/http/AxiosHttpClient';

const bootstrapAuth = () => {
    const appConfig = appDependencies.getAppConfig();
    const myRouter = appDependencies.getMyRouter();
    
    // Step 1: Create base repository with base client (for initial setup)
    const baseHttpClient = appDependencies.getHttpClient();
    const tempRepository = new HttpAuthRepository(baseHttpClient);
    const service = new AuthService(tempRepository);
    const useStore = createAuthStore(service);
    
    // Step 2: Get store instance to create token getter
    const store = useStore();
    
    // Step 3: Create authenticated HTTP client with token provider
    const authenticatedHttpClient = new AxiosHttpClient(
        appConfig.baseUrl,
        {},
        () => store.token,  // Token provider function
        myRouter
    );
    
    // Step 4: Create repository with authenticated client
    const authenticatedRepository = new HttpAuthRepository(authenticatedHttpClient);
    
    // Step 5: Update service to use authenticated repository
    // Note: Service doesn't need to change, but we could recreate it for clarity
    const authenticatedService = new AuthService(authenticatedRepository);
    
    // Step 6: Recreate store with authenticated service
    const authenticatedStore = createAuthStore(authenticatedService);
    
    return {
        useStore: authenticatedStore,
        routes: authRoutes,
    };
};
```

**Note**: The above bootstrap has some complexity. A simpler approach for Phase 2:

```typescript
const bootstrapAuth = () => {
    const appConfig = appDependencies.getAppConfig();
    const myRouter = appDependencies.getMyRouter();
    const baseHttpClient = appDependencies.getHttpClient();
    
    // Create repository, service, and store
    const repository = new HttpAuthRepository(baseHttpClient);
    const service = new AuthService(repository);
    const useStore = createAuthStore(service);
    
    // Get store instance for token getter
    const store = useStore();
    
    // Create authenticated client (will be used if repository needs it later)
    // For Phase 2, base client works since backend mock doesn't require tokens
    // Store provides token getter for future use in Phase 3
    
    return {
        useStore,
        routes: authRoutes,
        // Expose token getter for creating authenticated clients in other domains
        getTokenProvider: () => () => store.token,
    };
};
```

Actually, for Phase 2, we can simplify: since the backend mock doesn't validate tokens yet, the auth repository can use the base client. The token infrastructure is set up for Phase 3.

### 9. LoginPage Component (`domains/auth/components/LoginPage.vue`)

Basic UI structure (Phase 2 - no real OAuth yet):

```vue
<template>
  <div class="login-page">
    <h1>Login</h1>
    <button @click="handleLogin">Login with Google (Mock)</button>
    <!-- Phase 3: Real OAuth button -->
  </div>
</template>

<script setup lang="ts">
import { bootstrapAuth } from '@/domains/auth';
import { onMounted } from 'vue';

const bootstrap = bootstrapAuth();
const authStore = bootstrap.useStore();

const handleLogin = async () => {
    // Phase 2: Just fetch mock user
    await authStore.fetchCurrentUser();
    // Phase 3: Redirect to OAuth flow
};
</script>
```



### 10. Auth Routes (`domains/auth/routes.ts`)

```typescript
import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/domains/auth/components/LoginPage.vue'),
  },
];

export default routes;
```



### 11. Route Guards (`app/router/index.ts`)

Add non-enforcing route guards (structure only for Phase 2):

```typescript
import { bootstrapAuth } from '@/domains/auth';

// After router creation, register auth routes
const authBootstrap = bootstrapAuth();
authBootstrap.routes.forEach(route => router.addRoute(route));

// Add route guard structure (non-enforcing in Phase 2)
router.beforeEach((to, from, next) => {
    const authStore = authBootstrap.useStore();
    
    // Phase 2: Structure only - don't enforce yet
    // Phase 3: Check auth state and redirect to login if needed
    // if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    //   next({ name: 'login' });
    // } else {
    //   next();
    // }
    
    next();
});
```



### 12. Update bootstrapFeatures (`app/bootstrap/bootstrapFeatures.ts`)

```typescript
import { Router } from 'vue-router';
import { bootstrapNotes } from '@/domains/notes';
import { bootstrapAuth } from '@/domains/auth';

export const bootstrapFeatures = (router: Router): void => {
    console.log('Bootstrapping features...');
    
    // Bootstrap notes
    for (const route of bootstrapNotes().routes) {
        console.log('bootstrapFeatures, adding route: ', route.name);
        router.addRoute(route);
    }
    
    // Bootstrap auth
    for (const route of bootstrapAuth().routes) {
        console.log('bootstrapFeatures, adding auth route: ', route.name);
        router.addRoute(route);
    }
    
    console.log('Features bootstrapped successfully');
};
```



## Usage Pattern Summary

### Repositories that DON'T need auth:

```typescript
// Created in bootstrapDependencies
const baseHttpClient = new AxiosHttpClient(
    baseUrl, 
    {}, 
    undefined,  // No token provider
    router
);

// Notes repository uses base client
const notesRepository = new HttpNotesRepository(baseHttpClient);
```



### Repositories that DO need auth:

```typescript
// Created in auth/bootstrap.ts
const authenticatedHttpClient = new AxiosHttpClient(
    baseUrl,
    {},
    () => authStore.token,  // Token provider function
    router
);

// Auth repository uses authenticated client
const authRepository = new HttpAuthRepository(authenticatedHttpClient);
```



## Testing Strategy

- Unit tests for AuthService with mock repository
- Unit tests for AuthStore with mock service
- Integration tests for auth flow (calling `/auth/me`)
- Tests for token injection: verify `AxiosHttpClient` calls `getToken()` and adds header

## Phase 2 vs Phase 3

**Phase 2 (This Plan):**

- ✅ Auth domain structure
- ✅ Store, service, repository
- ✅ Token injection infrastructure (`getToken` function pattern)
- ✅ Login page UI (structure)
- ✅ Route guards (structure, non-enforcing)
- ✅ Mock authentication (always succeeds)

**Phase 3 (Future):**

- Real JWT validation
- OAuth flow implementation