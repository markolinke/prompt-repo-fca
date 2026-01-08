# Phase 1 Authentication - Simple Explanation

This document explains how Phase 1 authentication works in simple terms, as if you're new to the codebase.

## The Big Picture

Phase 1 sets up the **architecture** for authentication, but doesn't actually do real authentication yet. Think of it like building a house frame before adding the walls - we're creating the structure that will later support real login and security.

Right now, when someone asks "who are you?", we always answer with a fake user (mock user). Later phases will check if they're actually logged in.

---

## What Calls What: The Dependency Flow

Think of our code like a restaurant:

1. **Customer (HTTP Request)** → Orders food
2. **Waiter (Route Handler)** → Takes the order
3. **Chef (Service)** → Prepares the food using recipes
4. **Kitchen Helper (Provider)** → Gets ingredients

Here's how it works in our code:

```
HTTP Request 
    ↓
Route Handler (GET /auth/me)
    ↓
Middleware (get_current_user)
    ↓
Service (AuthenticationService)
    ↓
Provider (MockAuthProvider)
    ↓
Returns User
```

**Key Rule**: Each layer only talks to the layer below it, never skipping layers or talking backwards.

---

## What Depends on What: Clean Architecture Layers

Our code is organized in layers, from outer (closest to the user) to inner (business logic):

```
┌─────────────────────────────────┐
│  API Routes (routes.py)         │  ← Outer layer: Handles HTTP
├─────────────────────────────────┤
│  Middleware (auth_middleware.py)│  ← Extracts user from request
├─────────────────────────────────┤
│  Services (authentication_service.py) │  ← Business logic
├─────────────────────────────────┤
│  Providers (mock_auth_provider.py)   │  ← Actual work
└─────────────────────────────────┘
```

### Outer Layer: Routes (routes.py)
- **Job**: Receives HTTP requests, sends HTTP responses
- **Knows about**: Services, Middleware, Schemas
- **Does NOT know**: How authentication actually works (that's the provider's job)

### Middleware Layer (auth_middleware.py)
- **Job**: Gets the user from the request (for now, returns a mock user)
- **Knows about**: Services
- **Does NOT know**: How to check if a token is valid (that's the service/provider's job)

### Service Layer (authentication_service.py)
- **Job**: Orchestrates authentication logic
- **Knows about**: Provider (interface)
- **Does NOT know**: Which provider is being used (mock vs real)

### Provider Layer (mock_auth_provider.py)
- **Job**: Actually does the authentication work
- **Knows about**: User entity
- **Does NOT know**: HTTP, routes, or anything about the web

---

## How Requests Work: Step-by-Step

When you make a request like `GET http://localhost:8000/auth/me`, here's what happens:

### 1. Request Arrives at FastAPI
```
Browser/Client → FastAPI App → Router
```

### 2. Router Finds the Route
FastAPI looks for a route matching `/auth/me` and finds:
```python
@router.get("/me", response_model=UserResponseSchema)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
```

### 3. Middleware Runs (via `Depends`)
Before the route handler runs, FastAPI calls `get_current_user()` because of `Depends(get_current_user)`:

```python
# This runs FIRST, before the route handler
async def get_current_user(credentials: ...) -> User:
    token = credentials.credentials if credentials else "mock-token"
    user = await auth_service.get_current_user(token)
    return user
```

### 4. Service Called
The middleware calls the service:
```python
user = await auth_service.get_current_user(token)
```

### 5. Provider Does the Work
The service calls the provider:
```python
# In MockAuthProvider
async def authenticate(self, token: str) -> User:
    # Phase 1: Always returns mock user (no real checking)
    return User(id="mock-user-1", email="test@example.com", name="Test User")
```

### 6. Response Flows Back Up
```
Provider returns User
    ↓
Service returns User
    ↓
Middleware returns User
    ↓
Route handler receives User as `current_user`
    ↓
Route handler converts to schema and returns JSON
    ↓
Client receives: {"id": "mock-user-1", "email": "test@example.com", "name": "Test User"}
```

---

## Routes Added and Their Purpose

### New Route: `GET /auth/me`

**Purpose**: Returns information about the currently authenticated user.

**What it does**:
1. Calls middleware to get the current user
2. Converts user to response schema
3. Returns user data as JSON

**Example request**:
```bash
GET http://localhost:8000/auth/me
```

**Example response** (Phase 1):
```json
{
  "id": "mock-user-1",
  "email": "test@example.com",
  "name": "Test User"
}
```

**Note**: In Phase 1, you can call this with or without a Bearer token - it will always return the same mock user. In Phase 3, this will require a valid JWT token.

---

## Sequence of Execution: Startup and Request

### When Server Starts (Bootstrap)

1. **main.py** calls `create_app()`
2. `create_app()` calls `bootstrap_dependencies()`
3. **bootstrap.py** creates everything in order:

```python
# Step 1: Create the provider (does the actual work)
auth_provider = MockAuthProvider()

# Step 2: Create the service (uses the provider)
auth_service = AuthenticationService(auth_provider)

# Step 3: Create the router (uses the service)
auth_router = create_auth_router(auth_service)
```

4. Router is registered with FastAPI: `app.include_router(auth_router)`

### When Request Comes In

1. **HTTP Request**: `GET /auth/me`
2. **FastAPI**: Finds route in router
3. **Route Handler**: Sees `Depends(get_current_user)` - pauses and runs dependency first
4. **Middleware**: 
   - Gets token from request (or uses "mock-token")
   - Calls `auth_service.get_current_user(token)`
5. **Service**: Calls `auth_provider.authenticate(token)`
6. **Provider**: Returns mock user (always succeeds in Phase 1)
7. **Service**: Returns user to middleware
8. **Middleware**: Returns user to route handler
9. **Route Handler**: Converts user to `UserResponseSchema` and returns JSON
10. **FastAPI**: Sends JSON response to client

---

## What is Middleware and How It Works

### Simple Explanation

**Middleware** is like a security guard at the entrance of a building. Before you can enter, the guard checks your ID. In our case, the middleware checks if you're authenticated before letting you access the route.

### In FastAPI: Dependencies

In FastAPI, we use **Dependencies** (with `Depends()`) to create middleware-like behavior. When you write:

```python
async def get_current_user_info(current_user: User = Depends(get_current_user)):
```

FastAPI says: "Before running `get_current_user_info`, run `get_current_user` first and pass the result as `current_user`."

### How Our Middleware Works

1. **Factory Function**: `create_get_current_user(auth_service)`
   - Takes the service as input
   - Returns a function that FastAPI can use
   - This lets us inject the service during bootstrap

2. **The Dependency Function**: `get_current_user()`
   - FastAPI automatically calls this before the route handler
   - It extracts the token from the request (or uses "mock-token" in Phase 1)
   - Calls the service to get the user
   - Returns the user (which becomes `current_user` in the route handler)

3. **Error Handling**: If no user is found, it raises HTTP 401 (Unauthorized)

### Visual Flow

```
Request comes in
    ↓
FastAPI sees: Depends(get_current_user)
    ↓
Calls get_current_user() FIRST
    ↓
get_current_user() calls service
    ↓
Service calls provider
    ↓
Provider returns user
    ↓
get_current_user() returns user
    ↓
NOW FastAPI runs the route handler with current_user=User(...)
```

### Why This Pattern?

- **Separation of Concerns**: Authentication logic is separate from route logic
- **Reusability**: The same middleware can be used on multiple routes
- **Testability**: We can test routes with different users easily
- **Clean Code**: Routes don't need to know HOW authentication works

---

## Key Concepts for Phase 1

### 1. Dependency Injection

Instead of creating dependencies inside functions, we pass them in from the outside:

```python
# ❌ Bad: Creates dependency inside
def my_function():
    service = AuthenticationService()  # Hard to test!

# ✅ Good: Receives dependency from outside
def my_function(service: AuthenticationService):
    # Easy to test with mock service
```

### 2. Protocols (Interfaces)

A **Protocol** defines what methods a class must have, without saying HOW to implement them:

```python
# Protocol defines the contract
class AuthProviderPort(Protocol):
    async def authenticate(self, token: str) -> User | None:
        ...

# Implementation follows the contract
class MockAuthProvider:
    async def authenticate(self, token: str) -> User | None:
        return User(...)  # Actual implementation
```

This lets us swap `MockAuthProvider` for a real JWT provider later without changing the service.

### 3. Factory Functions

Instead of creating routes directly, we use factory functions that accept dependencies:

```python
def create_auth_router(auth_service: AuthenticationService):
    router = APIRouter(...)
    # Use auth_service here
    return router
```

This allows dependency injection at bootstrap time.

---

## Summary: The Complete Picture

```
┌─────────────────────────────────────────────────────────────┐
│                    HTTP Request                             │
│              GET http://localhost:8000/auth/me              │
└───────────────────────┬─────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  FastAPI App (main.py)                                      │
│  - Receives request                                         │
│  - Finds matching route                                     │
└───────────────────────┬─────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  Route (routes.py)                                          │
│  GET /auth/me                                               │
│  - Sees: Depends(get_current_user)                          │
│  - Pauses and calls middleware first                        │
└───────────────────────┬─────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  Middleware (auth_middleware.py)                            │
│  get_current_user()                                         │
│  - Gets token from request (or "mock-token")                │
│  - Calls service.get_current_user(token)                    │
└───────────────────────┬─────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  Service (authentication_service.py)                        │
│  AuthenticationService                                      │
│  - Calls provider.authenticate(token)                       │
└───────────────────────┬─────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  Provider (mock_auth_provider.py)                           │
│  MockAuthProvider                                           │
│  - Returns mock user (always succeeds in Phase 1)           │
└───────────────────────┬─────────────────────────────────────┘
                        ↓
                    User flows back up
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  Route Handler                                              │
│  - Receives User as current_user                            │
│  - Converts to UserResponseSchema                           │
│  - Returns JSON                                             │
└───────────────────────┬─────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  HTTP Response                                              │
│  {"id": "mock-user-1", "email": "test@example.com", ...}   │
└─────────────────────────────────────────────────────────────┘
```

---

## Testing Phase 1

### Using curl

```bash
# Without token (works in Phase 1)
curl http://localhost:8000/auth/me

# With token (also works, but ignored in Phase 1)
curl -H "Authorization: Bearer any-token-here" http://localhost:8000/auth/me
```

Both will return the same mock user.

### Expected Response

```json
{
  "id": "mock-user-1",
  "email": "test@example.com",
  "name": "Test User"
}
```

---

---

## Hands-On Learning Exercises

Here are practical exercises to deepen your understanding of Phase 1 authentication:

### Exercise 1: Protect a Notes Route with Authentication

**Goal**: See how middleware works on a real route.

**Steps**:
1. Open `src/domains/notes/api/routes.py`
2. Import the auth middleware:
   ```python
   from src.domains.auth.middleware.auth_middleware import create_get_current_user
   from src.domains.auth.entities.user import User
   ```
3. Modify the `create_notes_router` function to accept the auth service:
   ```python
   def create_notes_router(
       service: NotesService,
       auth_service: AuthenticationService  # Add this
   ) -> APIRouter:
   ```
4. Create the middleware dependency:
   ```python
   def create_notes_router(...) -> APIRouter:
       router = APIRouter(prefix="/notes", tags=["notes"])
       
       # Create auth middleware
       get_current_user = create_get_current_user(auth_service)
   ```
5. Add authentication to the create endpoint:
   ```python
   @router.post("", response_model=NoteResponseSchema, status_code=status.HTTP_201_CREATED)
   async def create_note(
       schema: NoteRequestSchema,
       current_user: User = Depends(get_current_user)  # Add this
   ):
       """Create a new note (requires authentication)."""
       # Now you have access to current_user!
       # You could log who created it, store user_id with note, etc.
       note = Note.from_request_schema(schema)
       # ... rest of the code
   ```

6. Update `bootstrap.py` to pass auth_service:
   ```python
   notes_router = create_notes_router(notes_service, auth_service)
   ```

**Test it**:
```bash
# Should work (Phase 1 doesn't validate tokens)
curl -X POST http://localhost:8000/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer fake-token" \
  -d '{"title": "My Note", "content": "Some content"}'

# Also works without token in Phase 1
curl -X POST http://localhost:8000/notes \
  -H "Content-Type: application/json" \
  -d '{"title": "My Note", "content": "Some content"}'
```

**What you learned**: How middleware protects routes and makes user info available.

---

### Exercise 2: Make Mock Provider Return Different Users

**Goal**: Understand dependency injection and how providers work.

**Steps**:
1. Open `src/domains/auth/providers/mock_auth_provider.py`
2. Modify it to return different users based on token:
   ```python
   async def authenticate(self, token: str) -> User | None:
       """Return different mock users based on token."""
       if token == "admin-token":
           return User(
               id="admin-1",
               email="admin@example.com",
               name="Admin User"
           )
       elif token == "user-token":
           return User(
               id="user-1",
               email="user@example.com",
               name="Regular User"
           )
       else:
           # Default mock user
           return User(
               id="mock-user-1",
               email="test@example.com",
               name="Test User"
           )
   ```

**Test it**:
```bash
# Get admin user
curl -H "Authorization: Bearer admin-token" http://localhost:8000/auth/me

# Get regular user
curl -H "Authorization: Bearer user-token" http://localhost:8000/auth/me

# Get default user
curl http://localhost:8000/auth/me
```

**What you learned**: How the provider abstraction works and how easy it is to change behavior.

---

### Exercise 3: Add a User-Specific Endpoint

**Goal**: See how user information is used in routes.

**Steps**:
1. Open `src/domains/auth/api/routes.py`
2. Add a new endpoint that uses the current user:
   ```python
   @router.get("/my-profile", response_model=UserResponseSchema)
   async def get_my_profile(
       current_user: User = Depends(get_current_user)
   ):
       """Get the current user's profile (example of using user in route)."""
       # You could add business logic here, like:
       # - Fetch user preferences from database
       # - Get user's recent activity
       # - Calculate user stats
       return UserResponseSchema(
           id=current_user.id,
           email=current_user.email,
           name=current_user.name
       )
   ```

**Test it**:
```bash
curl http://localhost:8000/auth/my-profile
```

**What you learned**: How routes access and use authenticated user information.

---

### Exercise 4: Trace the Dependency Flow Manually

**Goal**: Understand how dependencies are wired together.

**Steps**:
1. Start at `src/app/main.py` - find where `bootstrap_dependencies()` is called
2. Open `src/app/bootstrap.py` - trace the creation order:
   - `MockAuthProvider()` is created
   - `AuthenticationService(auth_provider)` is created (receives provider)
   - `create_auth_router(auth_service)` is called (receives service)
3. Open `src/domains/auth/api/routes.py` - see how router uses service:
   - Router calls `create_get_current_user(auth_service)`
   - Creates middleware that has access to service
4. Open `src/domains/auth/middleware/auth_middleware.py` - see how middleware uses service:
   - Middleware calls `auth_service.get_current_user(token)`
5. Open `src/domains/auth/services/authentication_service.py` - see how service uses provider:
   - Service calls `auth_provider.authenticate(token)`
6. Open `src/domains/auth/providers/mock_auth_provider.py` - see the final implementation

**Draw the flow** on paper or a whiteboard - this visualization helps cement understanding.

**What you learned**: How Clean Architecture layers connect and dependencies flow.

---

### Exercise 5: Add Logging to Understand Execution Order

**Goal**: See the actual execution sequence.

**Steps**:
1. Add print statements (or use logging) at key points:

   In `mock_auth_provider.py`:
   ```python
   async def authenticate(self, token: str) -> User | None:
       print(f"[Provider] Authenticating with token: {token}")
       user = User(...)
       print(f"[Provider] Returning user: {user.id}")
       return user
   ```

   In `authentication_service.py`:
   ```python
   async def get_current_user(self, token: str) -> User | None:
       print(f"[Service] Getting current user with token: {token}")
       user = await self.auth_provider.authenticate(token)
       print(f"[Service] Got user: {user.id if user else None}")
       return user
   ```

   In `auth_middleware.py`:
   ```python
   async def get_current_user(...) -> User:
       print(f"[Middleware] Processing request, token: {token}")
       user = await auth_service.get_current_user(token)
       print(f"[Middleware] Returning user: {user.id}")
       return user
   ```

   In `routes.py`:
   ```python
   async def get_current_user_info(...):
       print(f"[Route] Handler called with user: {current_user.id}")
       return UserResponseSchema(...)
   ```

**Test it**:
```bash
curl http://localhost:8000/auth/me
```

Watch the console output - you'll see the exact order of execution!

**What you learned**: The actual sequence of code execution in a request.

---

### Exercise 6: Create a New Protected Endpoint

**Goal**: Practice creating routes with authentication from scratch.

**Steps**:
1. Create a new endpoint in `src/domains/auth/api/routes.py`:
   ```python
   @router.get("/whoami", response_model=dict)
   async def whoami(current_user: User = Depends(get_current_user)):
       """Return information about the current user in a custom format."""
       return {
           "logged_in": True,
           "user_id": current_user.id,
           "user_email": current_user.email,
           "user_name": current_user.name,
           "message": f"Hello, {current_user.name}!"
       }
   ```

2. Test it:
   ```bash
   curl http://localhost:8000/auth/whoami
   ```

**What you learned**: How easy it is to create new protected endpoints once the infrastructure is in place.

---

### Exercise 7: Understand FastAPI's `Depends()` Better

**Goal**: Deep dive into FastAPI's dependency injection system.

**Steps**:
1. Read the FastAPI docs on dependencies: https://fastapi.tiangolo.com/tutorial/dependencies/
2. Experiment with different dependency patterns:
   - Dependencies on dependencies (nested)
   - Multiple dependencies on one route
   - Dependencies that return values vs. dependencies that do side effects

3. Try creating a simple dependency:
   ```python
   def get_db_connection():
       # Simulated database connection
       return {"connected": True}
   
   @router.get("/test")
   async def test_endpoint(db = Depends(get_db_connection)):
       return db
   ```

**What you learned**: FastAPI's dependency system is powerful and flexible.

---

### Exercise 8: Make Notes User-Specific (Advanced)

**Goal**: See how authentication enables user-specific data.

**Steps**:
1. Add `user_id` field to Note entity (temporarily, for learning)
2. Modify create_note to use current_user:
   ```python
   @router.post("", ...)
   async def create_note(
       schema: NoteRequestSchema,
       current_user: User = Depends(get_current_user)
   ):
       note = Note.from_request_schema(schema)
       # Store which user created this note
       # (You'd normally do this in the service/repository layer)
       print(f"Note created by user: {current_user.id}")
       # ... rest of code
   ```

3. Modify get_notes to filter by user (in service layer):
   ```python
   # In notes_service.py (you'd need to pass user_id)
   async def get_notes_for_user(self, user_id: str) -> list[Note]:
       all_notes = await self.repository.get_notes()
       # Filter notes for this user (simplified example)
       return [n for n in all_notes if n.user_id == user_id]
   ```

**What you learned**: How authentication enables multi-tenant applications.

---

### Exercise 9: Test Edge Cases

**Goal**: Understand error handling and edge cases.

**Steps**:
1. Test what happens with malformed tokens:
   ```bash
   curl -H "Authorization: Bearer" http://localhost:8000/auth/me
   curl -H "Authorization: invalid-format" http://localhost:8000/auth/me
   ```

2. Test empty requests:
   ```bash
   curl -X POST http://localhost:8000/auth/me
   ```

3. Modify mock provider to sometimes return None:
   ```python
   async def authenticate(self, token: str) -> User | None:
       if token == "invalid-token":
           return None  # Simulate failed auth
       return User(...)
   ```

   Then test:
   ```bash
   curl -H "Authorization: Bearer invalid-token" http://localhost:8000/auth/me
   ```

**What you learned**: How the system handles edge cases and errors.

---

### Exercise 10: Read the Source Code Systematically

**Goal**: Become comfortable navigating the codebase.

**Steps**:
1. Start at `src/app/main.py` - the entry point
2. Follow imports to understand what gets imported where
3. Read each file in the auth domain in this order:
   - `entities/user.py` - The data model
   - `providers/auth_provider_port.py` - The interface
   - `providers/mock_auth_provider.py` - The implementation
   - `services/authentication_service.py` - The business logic
   - `middleware/auth_middleware.py` - The HTTP layer
   - `api/routes.py` - The endpoints
   - `api/schemas.py` - The API contracts

4. For each file, ask yourself:
   - What does this file do?
   - What does it depend on?
   - What depends on it?
   - How would I test this?

**What you learned**: Code navigation and understanding architectural patterns.

---

## Quick Reference: Test Commands

Save these for quick testing:

```bash
# Test auth/me endpoint
curl http://localhost:8000/auth/me

# Test with token
curl -H "Authorization: Bearer any-token" http://localhost:8000/auth/me

# Test notes endpoint (after Exercise 1)
curl http://localhost:8000/notes

# Test creating note with auth (after Exercise 1)
curl -X POST http://localhost:8000/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token" \
  -d '{"title": "Test", "content": "Content"}'

# Test health check (should not require auth)
curl http://localhost:8000/health
```

---

## What's Next: Phase 3

In Phase 3, we'll replace the mock provider with real JWT validation:
- Tokens will be validated
- Invalid tokens will return 401
- Real users will be extracted from tokens
- The middleware will actually check authentication

But the architecture will stay the same - that's the beauty of Clean Architecture!

