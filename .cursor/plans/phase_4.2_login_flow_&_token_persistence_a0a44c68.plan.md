---
name: "Phase 4.2: Login Flow & Token Persistence"
overview: Implement the complete login flow with email/password authentication. This includes creating a LoginCredentials entity, adding login methods to repository and service layers, implementing login action in the store, and updating the LoginPage component to use the real API endpoint.
todos:
  - id: login-credentials-entity
    content: Create LoginCredentials entity with email/password validation
    status: completed
  - id: repository-port-login
    content: Add login() method to AuthRepositoryPort interface
    status: completed
  - id: http-repo-login
    content: Implement login() in HttpAuthRepository to call POST /auth/login
    status: completed
  - id: mock-repo-login
    content: Implement login() in MockAuthRepository for testing
    status: completed
  - id: auth-service-login
    content: Add login() method to AuthService that creates credentials and calls repository
    status: completed
  - id: auth-store-login
    content: Add login() action to AuthStore that calls service, sets tokens, and fetches user
    status: completed
  - id: login-page-component
    content: Update LoginPage component with email/password form and real login flow
    status: completed
  - id: update-tests
    content: "Update all tests: AuthService, AuthStore, login-flow integration, and test helpers"
    status: completed
  - id: export-entity
    content: Export LoginCredentials from index.ts
    status: completed
---

# Phase 4.2: Login Flow & Token Persistence Implementation Plan

## Overview

Implement the complete login flow connecting the frontend to the backend JWT authentication endpoint. This phase will enable users to log in with email and password, receive JWT tokens, persist them, and automatically fetch user information.

## Architecture Flow

```javascript
LoginPage (UI)
  ↓ calls
AuthStore.login(email, password)
  ↓ calls
AuthService.login(email, password)
  ↓ calls
AuthRepository.login(credentials)
  ↓ HTTP POST /auth/login
Backend API
  ↓ returns
{ access_token, refresh_token, token_type }
  ↓ stored via
TokenService → TokenRepository (localStorage)
  ↓ then
AuthStore.fetchCurrentUser() → GET /auth/me
```



## Implementation Steps

### Step 1: Create LoginCredentials Entity

**File:** `applications/frontend-app/src/domains/auth/entities/LoginCredentials.ts`

- Create a domain entity class following the pattern from `Note.ts`
- Properties: `email: string`, `password: string`
- Validation: 
- Email must be a valid email format
- Password must not be empty
- Method: `toPlainObject()` to convert to plain object for API request
- No `fromPlainObject()` needed (we don't deserialize credentials)
- Validation throws `ValidationError` from `@/common/errors/DomainError`

**Reference:** Follow entity pattern from `applications/frontend-app/src/domains/notes/entities/Note.ts`

### Step 2: Update AuthRepositoryPort Interface

**File:** `applications/frontend-app/src/domains/auth/repositories/AuthRepositoryPort.ts`

- Add method: `login(credentials: LoginCredentials): Promise<{ access_token: string; refresh_token: string; token_type: string }>`
- Return type matches backend API response schema

### Step 3: Implement Login in HttpAuthRepository

**File:** `applications/frontend-app/src/domains/auth/repositories/HttpAuthRepository.ts`

- Implement `login()` method
- Call `httpClient.post('/auth/login', credentials.toPlainObject())`
- Return the response directly (backend returns `{ access_token, refresh_token, token_type }`)
- Errors are handled by HTTP client (throws `UnauthorizedError` on 401)

### Step 4: Implement Login in MockAuthRepository

**File:** `applications/frontend-app/src/domains/auth/repositories/MockAuthRepository.ts`

- Implement `login()` method for testing
- Accept credentials (no real validation needed for mock)
- Return mock tokens: `{ access_token: 'mock-access-token', refresh_token: 'mock-refresh-token', token_type: 'bearer' }`
- Optionally validate email format to match real behavior

### Step 5: Update AuthService

**File:** `applications/frontend-app/src/domains/auth/services/AuthService.ts`

- Add method: `login(email: string, password: string): Promise<{ accessToken: string; refreshToken: string }>`
- Create `LoginCredentials` entity (validation happens here)
- Call `repository.login(credentials)`
- Transform response: `{ access_token, refresh_token }` → `{ accessToken, refreshToken }` (camelCase)
- Re-throw errors (service doesn't wrap, just propagates)

### Step 6: Update AuthStore

**File:** `applications/frontend-app/src/domains/auth/store/AuthStore.ts`

- Update `AuthServiceShape` type to include `login()` method
- Add action: `login(email: string, password: string): Promise<void>`
- Set `loading = true`, clear `error`
- Call `authService.login(email, password)`
- On success: call `setTokens(accessToken, refreshToken)` 
- After setting tokens: call `fetchCurrentUser()` to get user info
- On error: set `error` state, set `isAuthenticated = false`, re-throw
- Finally: set `loading = false`

### Step 7: Update LoginPage Component

**File:** `applications/frontend-app/src/domains/auth/components/LoginPage.vue`

- Replace mock button with real login form:
- Email input field (type="email", required)
- Password input field (type="password", required)
- Login button (disabled when loading)
- Error display (show `authStore.error` if present)
- Update `handleLogin()`:
- Get email/password from form inputs (use `ref()`)
- Call `authStore.login(email, password)`
- On success: navigate to home page (or redirect route if available)
- On error: error is already displayed via store state
- Use Tailwind CSS classes for styling (no scoped styles)
- Add `data-testid` attributes for testing

**Reference:** Follow component patterns from `applications/frontend-app/src/domains/notes/pages/NotesPage.vue`

### Step 8: Update Tests

#### 8.1: AuthService Tests

**File:** `applications/frontend-app/src/domains/auth/tests/AuthService.test.ts`

- Add test for successful login
- Add test for invalid credentials (repository throws error)
- Add test for validation error (invalid email format)

#### 8.2: AuthStore Tests

**File:** `applications/frontend-app/src/domains/auth/tests/AuthStore.test.ts`

- Add test: `'should login successfully and set tokens'`
- Mock service to return tokens
- Verify `setTokens()` is called with correct values
- Verify `fetchCurrentUser()` is called after tokens are set
- Add test: `'should handle login error'`
- Mock service to throw error
- Verify error state is set
- Verify tokens are not set
- Add test: `'should set loading state during login'`

#### 8.3: Login Flow Integration Test

**File:** `applications/frontend-app/src/domains/auth/tests/use-cases/login-flow.test.ts`

- Update existing test to use real login flow:
- Mount LoginPage
- Fill email and password inputs
- Click login button
- Verify store has tokens
- Verify store has user data
- Verify navigation occurs
- Mock bootstrap must include `login()` in AuthService and repository

#### 8.4: Update Test Helpers

**File:** `applications/frontend-app/src/domains/auth/tests/testHelpers.ts`

- Update `mockBootstrapAuth()` to include `login()` method in mock repository
- Mock repository should return mock tokens

**File:** `applications/frontend-app/src/domains/auth/tests/use-cases/LoginPageTestHelpers.ts`

- Add helper: `fillLoginForm(wrapper, email, password)`
- Add helper: `expectLoginError(wrapper, errorMessage)`

### Step 9: Export LoginCredentials

**File:** `applications/frontend-app/src/domains/auth/index.ts`

- Add export: `export { LoginCredentials } from './entities/LoginCredentials';`

## File Changes Summary

**New Files:**

- `applications/frontend-app/src/domains/auth/entities/LoginCredentials.ts`

**Modified Files:**

- `applications/frontend-app/src/domains/auth/repositories/AuthRepositoryPort.ts` - Add login method
- `applications/frontend-app/src/domains/auth/repositories/HttpAuthRepository.ts` - Implement login
- `applications/frontend-app/src/domains/auth/repositories/MockAuthRepository.ts` - Implement login
- `applications/frontend-app/src/domains/auth/services/AuthService.ts` - Add login method
- `applications/frontend-app/src/domains/auth/store/AuthStore.ts` - Add login action
- `applications/frontend-app/src/domains/auth/components/LoginPage.vue` - Replace mock with real form
- `applications/frontend-app/src/domains/auth/tests/AuthService.test.ts` - Add login tests
- `applications/frontend-app/src/domains/auth/tests/AuthStore.test.ts` - Add login tests
- `applications/frontend-app/src/domains/auth/tests/use-cases/login-flow.test.ts` - Update to real flow
- `applications/frontend-app/src/domains/auth/tests/testHelpers.ts` - Update mocks
- `applications/frontend-app/src/domains/auth/tests/use-cases/LoginPageTestHelpers.ts` - Add helpers
- `applications/frontend-app/src/domains/auth/index.ts` - Export LoginCredentials

## Testing Strategy

1. **Unit Tests**: Test each layer independently (entity validation, service, store)
2. **Integration Tests**: Test complete login flow end-to-end
3. **Mock Bootstrap**: All tests use `mockBootstrapAuth()` at top level (per AGENTS.md)
4. **Test Isolation**: Fresh Pinia instance per test, reset localStorage

## Key Design Decisions

1. **Entity Validation**: Validation happens in `LoginCredentials` constructor (throws `ValidationError`)
2. **Error Handling**: Service propagates errors, store catches and sets error state
3. **Token Storage**: Tokens are persisted immediately after successful login via `setTokens()`
4. **User Fetch**: After login, automatically fetch user info to populate store
5. **Casing**: Transform API response (snake_case) to camelCase in service layer

## Stable Milestone

After this phase:

- Users can log in with email/password
- Tokens are persisted to localStorage
- User information is automatically fetched after login