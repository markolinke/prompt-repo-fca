---
name: "Phase 3: JWT Authentication Implementation"
overview: Implement JWT-based authentication by creating JWT service, user/token repositories, updating authentication service with login/refresh methods, replacing mock provider with JWT provider, and adding login/refresh endpoints.
todos:
  - id: phase3-dependencies
    content: Add python-jose[cryptography] and python-dotenv to requirements.txt
    status: completed
  - id: phase3-env-config
    content: Create AppConfig class in common/env/app_config.py with JWT configuration (secret key, algorithm, expiry times)
    status: completed
  - id: phase3-jwt-service
    content: Create JWTService with encode_token, encode_refresh_token, decode_token, and validate_token methods
    status: completed
  - id: phase3-user-repo-port
    content: Create UserRepositoryPort protocol with get_by_email, get_by_id, create_user methods
    status: completed
  - id: phase3-user-repo-impl
    content: Create InMemoryUserRepository with mock user data for testing
    status: completed
    dependencies:
      - phase3-user-repo-port
  - id: phase3-token-repo-port
    content: Create TokenRepositoryPort protocol for refresh token storage/retrieval
    status: completed
  - id: phase3-token-repo-impl
    content: Create InMemoryTokenRepository implementing TokenRepositoryPort
    status: completed
    dependencies:
      - phase3-token-repo-port
  - id: phase3-update-auth-service
    content: Update AuthenticationService with login() and refresh_token() methods, integrate JWT service and repositories
    status: completed
    dependencies:
      - phase3-jwt-service
      - phase3-user-repo-port
      - phase3-token-repo-port
  - id: phase3-jwt-provider
    content: Create JWTAuthProvider implementing AuthProviderPort for JWT token validation
    status: completed
    dependencies:
      - phase3-jwt-service
      - phase3-user-repo-port
  - id: phase3-update-middleware
    content: Update auth middleware to require and validate JWT tokens (remove mock token logic)
    status: completed
    dependencies:
      - phase3-update-auth-service
  - id: phase3-auth-schemas
    content: Add LoginRequestSchema and TokenResponseSchema to api/schemas.py
    status: completed
  - id: phase3-auth-routes
    content: Add POST /auth/login and POST /auth/refresh endpoints to routes.py
    status: completed
    dependencies:
      - phase3-auth-schemas
      - phase3-update-auth-service
  - id: phase3-bootstrap
    content: Wire all JWT dependencies in bootstrap.py (JWTService, repositories, JWTAuthProvider)
    status: completed
    dependencies:
      - phase3-env-config
      - phase3-jwt-service
      - phase3-user-repo-impl
      - phase3-token-repo-impl
      - phase3-update-auth-service
      - phase3-jwt-provider
---

# Phase 3: Basic JWT Implementation (Vanilla, Self-Hosted)

## Overview

Phase 3 implements real JWT-based authentication, replacing the Phase 1 mock implementation. This includes JWT token generation, validation, refresh tokens, and login/refresh endpoints while maintaining Clean Architecture patterns.

## Architecture Flow

```javascript
┌─────────────────┐
│   API Routes    │  POST /auth/login, POST /auth/refresh
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Auth Service    │  login(), refresh_token(), get_current_user()
└────────┬────────┘
         │
    ┌────┴────┬──────────────────┐
    ▼         ▼                  ▼
┌─────────┐ ┌──────────┐  ┌────────────┐
│JWT      │ │User Repo │  │Token Repo  │
│Service  │ │Port      │  │Port        │
└─────────┘ └──────────┘  └────────────┘
    │
    ▼
┌─────────────────┐
│Auth Middleware  │  Validates JWT tokens from Authorization header
└─────────────────┘
```



## Implementation Tasks

### 1. Add Dependencies

**File**: `services/notes-service/requirements.txt`

- Add `python-jose[cryptography]==3.3.0` for JWT operations
- Add `python-dotenv==1.0.0` for environment variable management (if not already present)

### 2. Create Environment Configuration

**File**: `services/notes-service/src/common/env/app_config.py` (new)

- Create configuration class using Pydantic Settings
- Environment variables:
- `JWT_SECRET_KEY` (required, default: development key with warning)
- `JWT_ALGORITHM` (default: "HS256")
- `ACCESS_TOKEN_EXPIRY_HOURS` (default: 1)
- `REFRESH_TOKEN_EXPIRY_DAYS` (default: 7)
- Follow pattern from existing codebase for env configuration

### 3. Create JWT Service

**File**: `services/notes-service/src/domains/auth/services/jwt_service.py` (new)

- `JWTService` class with constructor accepting secret key and algorithm
- Methods:
- `encode_token(user_id: str, email: str, expires_in: timedelta) -> str`
- `encode_refresh_token(user_id: str, expires_in: timedelta) -> str`
- `decode_token(token: str) -> dict | None`
- `validate_token(token: str) -> dict | None` (validates expiration)
- Token payload structure:
- Access: `{sub: user_id, email: email, exp: expiration, type: "access"}`
- Refresh: `{sub: user_id, exp: expiration, type: "refresh"}`
- Use `jose.jwt.encode()` and `jose.jwt.decode()` with error handling

### 4. Create User Repository Port

**File**: `services/notes-service/src/domains/auth/repositories/user_repository_port.py` (new)

- `UserRepositoryPort` Protocol with methods:
- `async def get_by_email(email: str) -> User | None`
- `async def get_by_id(user_id: str) -> User | None`
- `async def create_user(user: User) -> None`

### 5. Create In-Memory User Repository

**File**: `services/notes-service/src/domains/auth/repositories/in_memory_user_repository.py` (new)

- `InMemoryUserRepository` implementing `UserRepositoryPort`
- Store users in `dict[str, User]` keyed by email and id
- Initialize with mock user(s) for testing:
- `test@example.com` / password: `password123` (or simple check)
- For Phase 3, password validation can be simple (constant or basic check)
- Pattern matches `InMemoryNotesRepository` from notes domain

### 6. Create Token Repository Port

**File**: `services/notes-service/src/domains/auth/repositories/token_repository_port.py` (new)

- `TokenRepositoryPort` Protocol with methods:
- `async def store_refresh_token(user_id: str, refresh_token: str) -> None`
- `async def get_refresh_token(user_id: str) -> str | None`
- `async def revoke_refresh_token(user_id: str) -> None`
- `async def validate_refresh_token(user_id: str, refresh_token: str) -> bool`

### 7. Create In-Memory Token Repository

**File**: `services/notes-service/src/domains/auth/repositories/in_memory_token_repository.py` (new)

- `InMemoryTokenRepository` implementing `TokenRepositoryPort`
- Store refresh tokens in `dict[str, str]` (user_id -> refresh_token)
- Pattern: `self._refresh_tokens[user_id] = refresh_token`

### 8. Update Authentication Service

**File**: `services/notes-service/src/domains/auth/services/authentication_service.py`

- Add constructor dependencies:
- `jwt_service: JWTService`
- `user_repository: UserRepositoryPort`
- `token_repository: TokenRepositoryPort`
- Add methods:
- `async def login(email: str, password: str) -> tuple[str, str]`:
    - Validate email/password via user repository
    - Generate access and refresh tokens via JWT service
    - Store refresh token in token repository
    - Return `(access_token, refresh_token)`
- `async def refresh_token(refresh_token: str) -> tuple[str, str]`:
    - Decode and validate refresh token
    - Verify token exists in token repository
    - Generate new access and refresh tokens
    - Update stored refresh token
    - Return `(access_token, refresh_token)`
- Update `get_current_user()` to use JWT service for token validation:
- Decode JWT token
- Extract user_id from token payload
- Fetch user from user repository
- Return User or None

### 9. Create JWT Auth Provider

**File**: `services/notes-service/src/domains/auth/providers/jwt_auth_provider.py` (new)

- `JWTAuthProvider` implementing `AuthProviderPort`
- Uses `JWTService` and `UserRepositoryPort` from AuthenticationService
- `authenticate(token: str)`:
- Validate JWT token via JWT service
- Extract user_id from payload
- Fetch user from user repository
- Return User or None

### 10. Update Auth Middleware

**File**: `services/notes-service/src/domains/auth/middleware/auth_middleware.py`

- Update `get_current_user()` dependency:
- Require `Authorization: Bearer <token>` header (no default mock token)
- Return 401 if credentials are missing
- Pass token to auth_service.get_current_user() for JWT validation
- Remove Phase 1 mock token logic

### 11. Add API Schemas

**File**: `services/notes-service/src/domains/auth/api/schemas.py`

- Add `LoginRequestSchema`:
- `email: str`
- `password: str`
- Add `TokenResponseSchema`:
- `access_token: str`
- `refresh_token: str`
- `token_type: str` (default: "bearer")

### 12. Update Auth Routes

**File**: `services/notes-service/src/domains/auth/api/routes.py`

- Add `POST /auth/login` endpoint:
- Accept `LoginRequestSchema`
- Call `auth_service.login(email, password)`
- Return `TokenResponseSchema`
- Handle `ValueError` (invalid credentials) -> 401
- Add `POST /auth/refresh` endpoint:
- Accept refresh token in request body (`RefreshTokenRequestSchema`)
- Call `auth_service.refresh_token(refresh_token)`
- Return `TokenResponseSchema`
- Handle invalid token -> 401
- Keep existing `GET /auth/me` endpoint (now uses real JWT validation)

### 13. Update Bootstrap

**File**: `services/notes-service/src/app/bootstrap.py`

- Import new dependencies:
- `JWTService`, `AppConfig`
- `InMemoryUserRepository`, `InMemoryTokenRepository`
- `JWTAuthProvider`
- Wire dependencies:
- Create `AppConfig` instance (reads from environment)
- Create `JWTService` with config
- Create `InMemoryUserRepository` and `InMemoryTokenRepository`
- Create `AuthenticationService` with JWT service and repositories
- Create `JWTAuthProvider` (or use AuthenticationService directly)
- Pass auth service to router
- Replace `MockAuthProvider` with JWT-based implementation

## Testing Considerations

- Unit tests for `JWTService` (encode/decode/validate)
- Unit tests for `AuthenticationService` (login/refresh/get_current_user)
- Integration tests for login/refresh endpoints
- Test protected routes require valid JWT
- Test token expiration handling
- Test invalid token scenarios

## Environment Variables

Create `.env` file (or document required env vars):

```env
JWT_SECRET_KEY=your-secret-key-here-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRY_HOURS=1
REFRESH_TOKEN_EXPIRY_DAYS=7
```



## Migration Notes

- Phase 1 mock provider can be kept for reference but won't be used
- All routes using `get_current_user` will now require valid JWT tokens
- Frontend (Phase 4) will need to send `Authorization: Bearer <token>` headers

## Files Summary

**New Files:**

- `src/common/env/app_config.py`
- `src/domains/auth/services/jwt_service.py`
- `src/domains/auth/repositories/user_repository_port.py`
- `src/domains/auth/repositories/in_memory_user_repository.py`