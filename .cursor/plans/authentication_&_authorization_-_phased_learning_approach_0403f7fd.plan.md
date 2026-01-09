---
name: Authentication & Authorization - Phased Learning Approach
overview: Implement authentication incrementally through multiple phases, starting with domain structure and architecture (no real auth), then adding JWT/OAuth basics, and finally integrating production providers like Cognito/Google SSO. Each phase is self-contained and builds on the previous one.
todos:
  - id: phase1-user-entity
    content: Create User entity in domains/auth/entities/user.py with id, email, name fields
    status: pending
  - id: phase1-auth-provider-port
    content: Create AuthProviderPort protocol in domains/auth/providers/auth_provider_port.py
    status: pending
  - id: phase1-mock-provider
    content: Create MockAuthProvider implementation that always returns a mock user
    status: pending
    dependencies:
      - phase1-auth-provider-port
      - phase1-user-entity
  - id: phase1-auth-service
    content: Create AuthenticationService that uses AuthProviderPort to authenticate
    status: pending
    dependencies:
      - phase1-mock-provider
  - id: phase1-auth-middleware
    content: Create get_current_user() FastAPI dependency that returns mock user via service
    status: pending
    dependencies:
      - phase1-auth-service
  - id: phase1-auth-routes
    content: "Create auth routes: GET /auth/me endpoint returning current user"
    status: pending
    dependencies:
      - phase1-auth-middleware
  - id: phase1-bootstrap
    content: Wire auth dependencies in app/bootstrap.py and register routes in main.py
    status: pending
    dependencies:
      - phase1-auth-routes
  - id: phase2-frontend-user
    content: Create User entity TypeScript class matching backend in domains/auth/entities/User.ts
    status: pending
  - id: phase2-auth-store
    content: Create Pinia AuthStore with state for user and methods (login/logout placeholders)
    status: pending
    dependencies:
      - phase2-frontend-user
  - id: phase2-auth-service
    content: Create AuthService with placeholder methods for login/logout/refresh
    status: pending
    dependencies:
      - phase2-auth-store
  - id: phase2-update-http-client
    content: Update AxiosHttpClient to accept getAuthToken function and inject token into Authorization header
    status: pending
  - id: phase2-wire-token-getter
    content: Update bootstrapDependencies to pass auth store token getter to HTTP client
    status: pending
    dependencies:
      - phase2-auth-store
      - phase2-update-http-client
  - id: phase2-route-guard-component
    content: Create RequireAuth.vue component as route guard (non-enforcing placeholder)
    status: pending
    dependencies:
      - phase2-auth-store
  - id: phase3-jwt-service
    content: Create JWTService with encode/decode/validate methods using python-jose
    status: pending
  - id: phase3-auth-service-login
    content: Add login method to AuthenticationService that generates JWT tokens
    status: pending
    dependencies:
      - phase3-jwt-service
  - id: phase3-token-validation
    content: Update auth middleware to validate JWT tokens instead of returning mock user
    status: pending
    dependencies:
      - phase3-jwt-service
  - id: phase3-login-endpoint
    content: Add POST /auth/login endpoint that accepts credentials and returns JWT tokens
    status: pending
    dependencies:
      - phase3-auth-service-login
  - id: phase3-refresh-token
    content: Add refresh token storage and POST /auth/refresh endpoint
    status: pending
    dependencies:
      - phase3-auth-service-login
  - id: phase4-frontend-login
    content: Implement login page with form and POST /auth/login API call
    status: pending
  - id: phase4-token-storage
    content: Store access token in auth store and refresh token securely (cookie or localStorage)
    status: pending
    dependencies:
      - phase4-frontend-login
  - id: phase4-http-client-401
    content: "Handle 401 responses in HTTP client: attempt token refresh or redirect to login"
    status: pending
    dependencies:
      - phase4-token-storage
  - id: phase4-enforce-route-guard
    content: Update RequireAuth component to actually block access and redirect to login if not authenticated
    status: pending
    dependencies:
      - phase4-token-storage
  - id: phase4-logout
    content: "Implement logout functionality: clear tokens, reset store, redirect to login"
    status: pending
    dependencies:
      - phase4-token-storage
---

# Authentication & Authorization - Phased Learning Approach

## Quick Phase Summary

### Phase 1: Backend Domain Structure (No Real Auth)

**Todos**: `phase1-user-entity` → `phase1-auth-provider-port` → `phase1-mock-provider` → `phase1-auth-service` → `phase1-auth-middleware` → `phase1-auth-routes` → `phase1-bootstrap`**Goal**: Set up Clean Architecture structure for auth domain with mock authentication

### Phase 2: Frontend Structure (No Real Auth)

**Todos**: `phase2-frontend-user` → `phase2-auth-store` → `phase2-auth-service` → `phase2-update-http-client` → `phase2-wire-token-getter` → `phase2-route-guard-component`**Goal**: Prepare frontend auth architecture without real authentication

### Phase 3: Basic JWT Implementation (Vanilla, Self-Hosted)

**Todos**: `phase3-jwt-service` → `phase3-auth-service-login` → `phase3-token-validation` → `phase3-login-endpoint` → `phase3-refresh-token`**Goal**: Implement real JWT-based authentication with vanilla Python libraries

### Phase 4: Frontend JWT Integration

**Todos**: `phase4-frontend-login` → `phase4-token-storage` → `phase4-http-client-401` → `phase4-enforce-route-guard` → `phase4-logout`**Goal**: Connect frontend to JWT backend with full login flow and route protection---

## Philosophy

This plan follows an **incremental, pedagogical approach**:

- **Phase 1-2**: Build architecture structure (no real auth) - learn Clean Architecture patterns
- **Phase 3-4**: Add vanilla JWT/OAuth implementation - learn authentication fundamentals
- **Phase 5+**: Integrate production providers - learn real-world integration

Each phase is **self-contained** and **testable**, making it perfect for learning and onboarding.---

## Phase 1: Backend Domain Structure (No Real Auth)

**Goal**: Set up auth domain architecture without actual authentication. Establish patterns that will support real auth later.

### What We Build

1. **Auth Domain Structure** (`domains/auth/`)

- User entity (with mock/default user)
- Auth service (returns mock authenticated user)
- Auth provider port (interface for future implementations)
- Mock auth provider (always "authenticates" successfully)

2. **Auth Middleware** (non-enforcing)

- FastAPI dependency `get_current_user()` that returns mock user
- Can be used on routes but doesn't actually validate anything

3. **Basic Auth Routes** (no real login)

- `GET /auth/me` - Returns current (mock) user
- Placeholder routes structure

### Implementation Details

**Files to create:**

- `domains/auth/entities/user.py` - User entity with fields: `id`, `email`, `name`
- `domains/auth/providers/auth_provider_port.py` - Protocol interface
- `domains/auth/providers/mock_auth_provider.py` - Mock implementation (always succeeds)
- `domains/auth/services/authentication_service.py` - Service that uses provider
- `domains/auth/api/routes.py` - Basic routes
- `domains/auth/api/schemas.py` - User response schemas
- `domains/auth/middleware/auth_middleware.py` - `get_current_user()` dependency

**Key Pattern**:

```python
# auth_provider_port.py
class AuthProviderPort(Protocol):
    async def authenticate(self, token: str) -> User | None:
        """Validate token and return user, or None if invalid."""
        ...

# mock_auth_provider.py
class MockAuthProvider:
    async def authenticate(self, token: str) -> User | None:
        # Always returns a mock user (no validation)
        return User(id="mock-user-1", email="john.doe@ancorit.com", name="Test User")

# auth_middleware.py
async def get_current_user(
    provider: AuthProviderPort = Depends(get_auth_provider)
) -> User:
    # For now, just return mock user (no token validation)
    return await provider.authenticate("mock-token")
```

**Integration:**

- Wire dependencies in `app/bootstrap.py`
- Register routes in `app/main.py`
- **Optional**: Add `Depends(get_current_user)` to notes routes (still works, just uses mock user)

### Tests

- Test `AuthenticationService` with mock provider
- Test middleware returns mock user
- Test `/auth/me` endpoint returns user

**Learning Outcome**: Understand Clean Architecture layers, dependency injection, port/adapter pattern.---

## Phase 2: Frontend Structure (No Real Auth)

**Goal**: Prepare frontend for auth without actual authentication. HTTP client can accept tokens but doesn't use them yet.

### What We Build

1. **Auth Domain Structure** (`domains/auth/`)

- User entity (matches backend)
- Auth store (Pinia) - stores mock user
- Auth service - placeholder methods
- Auth repository port and mock implementation

2. **HTTP Client Update** (token-aware, but not used)

- Modify `AxiosHttpClient` constructor to accept `getAuthToken: () => string | null`
- If token exists, inject `Authorization` header
- For now, token is always `null`, so no header added

3. **Route Preparation** (guards not enforcing)

- Create `RequireAuth` route guard component
- Doesn't block access yet, just shows structure
- Login page placeholder

### Implementation Details

**Files to create:**

- `domains/auth/entities/User.ts` - User entity
- `domains/auth/store/AuthStore.ts` - Pinia store (stores mock user initially)
- `domains/auth/services/AuthService.ts` - Service with placeholder methods
- `domains/auth/repositories/AuthRepositoryPort.ts` - Interface
- `domains/auth/repositories/MockAuthRepository.ts` - Mock implementation
- `domains/auth/components/RequireAuth.vue` - Route guard component
- `domains/auth/pages/LoginPage.vue` - Placeholder login page

**Key Changes:**

```typescript
// Update AxiosHttpClient to accept token getter
constructor(
    private readonly baseUrl: string,
    private readonly headers: Record<string, string> = {},
    private readonly getAuthToken: () => string | null = () => null, // New
    private readonly router: MyRouterPort
) {}

private createClient(params: object = {}): AxiosInstance {
    const config: AxiosRequestConfig = {
        baseURL: this.baseUrl,
        headers: this.headers,
    };
    const token = this.getAuthToken(); // Get token dynamically
    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return axios.create(config);
}
```

**Integration:**

- Update `bootstrapDependencies.ts` to pass token getter to HTTP client
- Wire auth domain in `bootstrapFeatures.ts`
- Add login route (non-functional yet)

**Learning Outcome**: Frontend auth architecture, dependency injection patterns, route guards structure.---

## Phase 3: Basic JWT Implementation (Vanilla, Self-Hosted)

**Goal**: Implement real JWT-based authentication without external providers. Simple username/password or token-based login.

### What We Build

1. **JWT Token Generation & Validation**

- Use `python-jose` library for JWT operations
- Simple secret key-based signing (no asymmetric keys yet)
- Token payload: `{sub: user_id, email: email, exp: expiration}`

2. **Simple Login Flow**

- `POST /auth/login` - Accepts email/password (or just email for mock)
- Returns JWT access token and refresh token
- Stores refresh tokens (in-memory for now)

3. **Token Validation Middleware**

- Update `get_current_user()` to actually validate JWT
- Extract user from token payload
- Handle invalid/expired tokens (401)

4. **Refresh Token Endpoint**

- `POST /auth/refresh` - Accepts refresh token, returns new access token

### Implementation Details

**Files to modify/create:**

- `domains/auth/services/jwt_service.py` - JWT encode/decode/validate
- `domains/auth/services/authentication_service.py` - Add login/refresh methods
- `domains/auth/middleware/auth_middleware.py` - Real token validation
- `domains/auth/api/routes.py` - Add login/refresh endpoints
- `domains/auth/api/schemas.py` - LoginRequest, TokenResponse schemas

**Key Implementation:**

```python
# jwt_service.py
class JWTService:
    def __init__(self, secret_key: str):
        self.secret_key = secret_key
    
    def encode_token(self, user_id: str, email: str) -> str:
        payload = {
            "sub": user_id,
            "email": email,
            "exp": datetime.utcnow() + timedelta(hours=1)
        }
        return jwt.encode(payload, self.secret_key, algorithm="HS256")
    
    def decode_token(self, token: str) -> dict | None:
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=["HS256"])
            return payload
        except JWTError:
            return None

# authentication_service.py
async def login(self, email: str, password: str) -> tuple[str, str]:
    # Validate credentials (mock for now, or simple check)
    user = await self.user_repository.get_by_email(email)
    if not user:
        raise ValueError("Invalid credentials")
    
    access_token = self.jwt_service.encode_token(user.id, user.email)
    refresh_token = self.jwt_service.encode_refresh_token(user.id)
    
    # Store refresh token
    await self.token_repository.store_refresh_token(user.id, refresh_token)
    
    return access_token, refresh_token
```

**Configuration:**

- Add `JWT_SECRET_KEY` to environment variables
- Add `JWT_ALGORITHM` (default: HS256)
- Add `ACCESS_TOKEN_EXPIRY` (default: 1 hour)
- Add `REFRESH_TOKEN_EXPIRY` (default: 7 days)

### Tests

- Test JWT encoding/decoding
- Test token validation with valid/expired/invalid tokens
- Test login flow returns tokens
- Test refresh token flow
- Test protected routes with valid/invalid tokens

**Learning Outcome**: JWT fundamentals, token-based auth, middleware security patterns.---

## Phase 4: Frontend JWT Integration

**Goal**: Connect frontend to JWT-based backend. Implement login flow, token storage, and protected routes.

### What We Build

1. **Login Flow**

- Login page with email/password form
- Call `/auth/login`, store tokens
- Redirect to app after successful login

2. **Token Storage**

- Store access token in memory (Vue store)
- Store refresh token in httpOnly cookie or localStorage
- Auto-refresh expired tokens

3. **HTTP Client Integration**

- Inject access token into all requests
- Handle 401 responses (refresh token or redirect to login)

4. **Route Guards (Real)**

- `RequireAuth` component checks auth state
- Redirects to login if not authenticated
- Protects routes that need auth

5. **Auth State Management**

- Update AuthStore with real user data from token
- Handle logout (clear tokens, redirect)

### Implementation Details

**Files to modify:**

- `domains/auth/services/AuthService.ts` - Implement login/logout/refresh
- `domains/auth/store/AuthStore.ts` - Store real user and tokens
- `domains/auth/components/RequireAuth.vue` - Enforce auth
- `domains/auth/pages/LoginPage.vue` - Functional login form
- `common/http/AxiosHttpClient.ts` - Token injection and 401 handling

**Key Pattern:**

```typescript
// AuthService.ts
async login(email: string, password: string): Promise<void> {
    const response = await this.repository.login({ email, password });
    this.store.setAccessToken(response.accessToken);
    this.store.setRefreshToken(response.refreshToken);
    await this.fetchCurrentUser(); // Get user info
}

// AuthStore.ts
async refreshToken(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) throw new Error("No refresh token");
    
    const response = await this.service.refresh(refreshToken);
    this.setAccessToken(response.accessToken);
}

// AxiosHttpClient - handle 401
private async handle401(): Promise<void> {
    try {
        await authStore.refreshToken();
        // Retry original request
    } catch {
        authStore.logout();
        this.router.navigateTo({ name: 'Login' });
    }
}
```

**Learning Outcome**: OAuth2-like client flow, token management, secure storage patterns, route protection.---

## Phase 5: OAuth2/OIDC Foundation (Optional Enhancement)

**Goal**: Implement OAuth2 authorization code flow structure (still vanilla, not using real providers yet).

### What We Build

1. **OAuth2 Flow Endpoints**

- `GET /auth/authorize` - Authorization endpoint
- `GET /auth/callback` - Callback handler
- OAuth2 state management (CSRF protection)

2. **OAuth2 Provider Interface**

- Extend `AuthProviderPort` with OAuth2 methods
- Abstract OAuth2 flow implementation

3. **Mock OAuth2 Provider**

- Simulate OAuth2 flow without real provider
- Useful for testing and learning

**Learning Outcome**: OAuth2 flow understanding, authorization code pattern, state management.---

## Phase 6: Production Provider Integration (Cognito/Google SSO)

**Goal**: Replace mock implementations with real AWS Cognito and Google OAuth integration.

### What We Build

1. **Cognito Auth Provider**

- Implement `CognitoAuthProvider` using `boto3`
- Handle Cognito JWT validation
- Implement OAuth2 callback flow

2. **Google SSO Integration**

- Configure Google OAuth in Cognito
- Handle Google OAuth redirects
- Map Google user to Cognito user

3. **Production Configuration**

- Environment variables for Cognito
- Google OAuth credentials
- Production token storage (secure cookies)

**Learning Outcome**: Real-world provider integration, production security patterns, OAuth2 in practice.---

## Phase 7: Authorization & RBAC (Future)

**Goal**: Add role-based access control and permissions.

### What We Build

1. **User Roles & Permissions**

- Role entity
- Permission checks in authorization service
- Route-level permission decorators

2. **Protected Resources**

- Users can only access their own notes
- Admin-only endpoints
- Role-based route protection

---

## Implementation Notes

### Testing Strategy

Each phase includes:

- **Unit tests**: Service layer with mocks
- **Integration tests**: API endpoints
- **Frontend tests**: Store, service, components

### Clean Architecture Compliance

All phases follow Clean Architecture:

- ✅ Domain layer (entities, services) framework-agnostic
- ✅ Provider ports abstract implementations
- ✅ Dependencies flow inward
- ✅ Easy to swap implementations (mock → JWT → Cognito)

### Migration Between Phases

Each phase is **backward compatible**:

- Phase 2 can still work with Phase 1 backend