# Phase 3: Basic JWT Implementation - Developer Guide

## Overview

Phase 3 replaces the mock authentication from Phase 1 with **real JWT (JSON Web Token) authentication**. This means users must log in with credentials to get a token, and that token is required to access protected endpoints.

---

## What Changed from Phase 1?

**Phase 1**: Anyone could access protected routes - we just returned a fake "Test User"  
**Phase 3**: You must log in first, get a real token, and use that token to access protected routes

---

## How Does It Work? (Simple Explanation)

Think of it like getting a badge at a conference:

1. **Login** = Show your ID at the registration desk, get a badge (token)
2. **Protected Routes** = Security checks your badge before letting you in
3. **Token Expires** = Your badge stops working after a while, you need a new one

In our system:
- **Login** = `POST /auth/login` with email/password → returns access_token and refresh_token
- **Protected Routes** = Middleware checks the token in the `Authorization` header
- **Token Refresh** = Use refresh_token to get a new access_token when it expires

---

## What Calls What? (Dependency Flow)

Here's the hierarchy from top to bottom:

```
API Request
    ↓
FastAPI Route (/auth/login, /auth/me, etc.)
    ↓
AuthenticationService (business logic)
    ↓
    ├──→ JWTService (creates/validates tokens)
    ├──→ UserRepository (finds users by email/ID)
    └──→ TokenRepository (stores refresh tokens)
```

### Detailed Flow Example: Login Request

1. **Client** sends `POST /auth/login` with email/password
2. **Route Handler** (`routes.py`) receives request
3. **Route** calls `auth_service.login(email, password)`
4. **AuthenticationService**:
   - Asks `UserRepository`: "Does this email exist? Is password correct?"
   - If yes, asks `JWTService`: "Create two tokens (access + refresh)"
   - Tells `TokenRepository`: "Store this refresh token for this user"
   - Returns both tokens to the route
5. **Route** returns tokens to the client

---

## What Depends on What?

### Core Dependencies (Bottom-Up)

```
User Entity (id, email, name)
    ↑
UserRepository (finds users)
    ↑
JWTService (creates tokens from user info)
    ↑
AuthenticationService (uses all of the above)
    ↑
Routes (uses AuthenticationService)
```

### Bootstrap Wiring (How Everything Gets Connected)

When the app starts, `bootstrap.py` creates everything in this order:

1. **AppConfig** - Reads environment variables (JWT secret key, expiry times)
2. **JWTService** - Created with secret key from config
3. **UserRepository** - In-memory storage (has test user: `test@example.com` / `password123`)
4. **TokenRepository** - In-memory storage for refresh tokens
5. **AuthenticationService** - Wired with JWT service + both repositories
6. **JWTAuthProvider** - Optional adapter (for consistency with Phase 1 pattern)
7. **Routes** - Created with AuthenticationService

**Key Point**: Everything is created once at startup and reused for all requests.

---

## How Do Requests Work?

### 1. Login Request (No Token Needed)

```
POST /auth/login
Headers: Content-Type: application/json
Body: {
    "email": "test@example.com",
    "password": "password123"
}

Response: {
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc...",
    "token_type": "bearer"
}
```

**What Happens**:
- Route validates email/password format
- Service checks if user exists and password matches
- Service creates JWT tokens (access token expires in 1 hour, refresh in 7 days)
- Service stores refresh token in memory
- Tokens returned to client

### 2. Protected Request (Token Required)

```
GET /auth/me
Headers: 
    Authorization: Bearer eyJhbGc...

Response: {
    "id": "user-1",
    "email": "test@example.com",
    "name": "Test User"
}
```

**What Happens**:
- Middleware intercepts request
- Extracts token from `Authorization` header
- Calls `auth_service.get_current_user(token)`
- Service validates token (checks signature, expiration)
- Service extracts user_id from token
- Service fetches user from repository
- User returned to route, route returns user info to client

### 3. Refresh Token Request

```
POST /auth/refresh
Headers: Content-Type: application/json
Body: {
    "refresh_token": "eyJhbGc..."
}

Response: {
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc...",
    "token_type": "bearer"
}
```

**What Happens**:
- Service validates refresh token
- Checks if refresh token exists in TokenRepository
- Creates new access and refresh tokens
- Updates stored refresh token
- Returns new tokens

---

## Routes Added and Their Purpose

### `POST /auth/login`
- **Purpose**: Authenticate user and get tokens
- **Auth Required**: No
- **Request Body**: `{email: string, password: string}`
- **Response**: `{access_token, refresh_token, token_type}`
- **Use Case**: User logs into the app

### `POST /auth/refresh`
- **Purpose**: Get new tokens when access token expires
- **Auth Required**: No (but needs valid refresh_token)
- **Request Body**: `{refresh_token: string}`
- **Response**: `{access_token, refresh_token, token_type}`
- **Use Case**: Access token expired, get new one without logging in again

### `GET /auth/me` (Updated from Phase 1)
- **Purpose**: Get current authenticated user's info
- **Auth Required**: Yes (Authorization header with Bearer token)
- **Request Body**: None
- **Response**: `{id, email, name}`
- **Use Case**: Check who is logged in, display user profile

---

## Sequence of Execution (Login Flow Example)

```
Time  | Component           | Action
------|---------------------|----------------------------------
T0    | Client              | Sends POST /auth/login
T1    | FastAPI Router      | Receives request, validates schema
T2    | Route Handler       | Calls auth_service.login()
T3    | AuthenticationService| Validates email/password
T4    | UserRepository      | Looks up user by email
T5    | UserRepository      | Validates password matches
T6    | AuthenticationService| Gets user, asks JWTService for tokens
T7    | JWTService          | Creates access_token (expires 1h)
T8    | JWTService          | Creates refresh_token (expires 7d)
T9    | AuthenticationService| Stores refresh_token in TokenRepository
T10   | Route Handler       | Returns tokens to client
T11   | Client              | Stores tokens (e.g., in localStorage)
```

### Protected Route Flow Example

```
Time  | Component           | Action
------|---------------------|----------------------------------
T0    | Client              | Sends GET /auth/me with Authorization header
T1    | FastAPI Router      | Receives request
T2    | Middleware          | Intercepts request, extracts token
T3    | get_current_user()  | Calls auth_service.get_current_user(token)
T4    | AuthenticationService| Validates token via JWTService
T5    | JWTService          | Decodes token, checks expiration
T6    | AuthenticationService| Extracts user_id from token payload
T7    | UserRepository      | Fetches user by ID
T8    | get_current_user()  | Returns user (or raises 401 if invalid)
T9    | Route Handler       | Returns user info to client
```

---

## What is Middleware and How Does It Work?

### Simple Explanation

**Middleware** is code that runs **between** the client request and your route handler. Think of it as a checkpoint:

```
Request → [Middleware] → Route Handler → Response
```

### In Our System: `get_current_user` Dependency

In FastAPI, middleware-like behavior is often done with **dependencies**. Our `get_current_user` function:

1. **Intercepts** requests to routes that use it
2. **Extracts** the token from the `Authorization` header
3. **Validates** the token is valid and not expired
4. **Fetches** the user from the database
5. **Provides** the user to the route handler (or blocks the request with 401)

### Code Location

**File**: `src/domains/auth/middleware/auth_middleware.py`

```python
async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security)
) -> User:
    # If no Authorization header → 401
    if not credentials:
        raise HTTPException(status_code=401, ...)
    
    # Validate token and get user
    user = await auth_service.get_current_user(credentials.credentials)
    if not user:
        raise HTTPException(status_code=401, ...)
    
    return user
```

### How It's Used in Routes

```python
@router.get("/me")
async def get_current_user_info(
    current_user: User = Depends(get_current_user)  # ← Middleware runs here
):
    return current_user  # User is already authenticated
```

**Key Point**: If `get_current_user` raises an exception, the route handler never runs. The request is blocked.

---

## How to Test It

### Prerequisites

1. Install dependencies:
   ```bash
   cd services/notes-service
   source env/bin/activate
   pip install -r requirements.txt
   ```

2. Start the server:
   ```bash
   python run.py
   # Server runs on http://localhost:8000
   ```

### Test 1: Login and Get Tokens

**Using curl**:
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Expected Response**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Save the access_token** for the next test!

### Test 2: Access Protected Route

Replace `YOUR_ACCESS_TOKEN` with the token from Test 1:

```bash
curl -X GET http://localhost:8000/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response**:
```json
{
  "id": "user-1",
  "email": "test@example.com",
  "name": "Test User"
}
```

### Test 3: Try Without Token (Should Fail)

```bash
curl -X GET http://localhost:8000/auth/me
```

**Expected Response**: `401 Unauthorized`

### Test 4: Try With Invalid Token (Should Fail)

```bash
curl -X GET http://localhost:8000/auth/me \
  -H "Authorization: Bearer fake-token-123"
```

**Expected Response**: `401 Unauthorized`

### Test 5: Refresh Token

Replace `YOUR_REFRESH_TOKEN` with the refresh_token from Test 1:

```bash
curl -X POST http://localhost:8000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "YOUR_REFRESH_TOKEN"
  }'
```

**Expected Response**: New access_token and refresh_token

### Test 6: Use Swagger UI (Interactive)

1. Open browser: `http://localhost:8000/docs`
2. Click on `POST /auth/login` → "Try it out"
3. Enter:
   ```json
   {
     "email": "test@example.com",
     "password": "password123"
   }
   ```
4. Click "Execute"
5. Copy the `access_token` from response
6. Click the "Authorize" button (top right)
7. Enter: `Bearer YOUR_ACCESS_TOKEN`
8. Try `GET /auth/me` → should work!

---

## How to Play With It to Learn More

### Experiment 1: Understand Token Structure

1. Get a token from login
2. Go to https://jwt.io
3. Paste your token in the "Encoded" section
4. See the decoded payload:
   ```json
   {
     "sub": "user-1",
     "email": "test@example.com",
     "type": "access",
     "exp": 1234567890,
     "iat": 1234567890
   }
   ```
5. Try changing values and see if it still validates (it won't - signature will be invalid)

### Experiment 2: Token Expiration

1. In `app_config.py`, change `access_token_expiry_hours` to `0.001` (3.6 seconds)
2. Restart server
3. Login, get token
4. Wait 5 seconds
5. Try `GET /auth/me` → should get 401 (token expired)
6. Use refresh_token to get new access_token

### Experiment 3: Add a New User

1. Modify `InMemoryUserRepository._initialize_mock_data()`:
   ```python
   mock_user2 = User(
       id="user-2",
       email="newuser@example.com",
       name="New User"
   )
   self._users_by_id[mock_user2.id] = mock_user2
   self._users_by_email[mock_user2.email] = mock_user2
   self._passwords[mock_user2.email] = "newpass123"
   ```
2. Restart server
3. Login with `newuser@example.com` / `newpass123`
4. Verify it works!

### Experiment 4: Trace the Code

1. Add print statements to see execution flow:
   ```python
   # In authentication_service.py, login method
   print(f"Login attempt for email: {email}")
   
   # In jwt_service.py, encode_token
   print(f"Creating token for user_id: {user_id}")
   
   # In auth_middleware.py, get_current_user
   print(f"Validating token: {token[:20]}...")
   ```
2. Make requests and watch the console output
3. See exactly what gets called and in what order

### Experiment 5: Break Things (Safely)

Try these and see what happens:

1. Send login with wrong password → Should get 401
2. Send login with non-existent email → Should get 401
3. Send refresh with invalid token → Should get 401
4. Send `/auth/me` without Authorization header → Should get 401
5. Modify token payload (change user_id) → Should get 401 (signature invalid)

### Experiment 6: Understand Repository Pattern

1. Open `InMemoryUserRepository`
2. See how users are stored in dictionaries
3. Notice it's all in-memory (data lost on server restart)
4. Think about: "How would I replace this with a database?"
5. Answer: Create `DatabaseUserRepository` that implements the same `UserRepositoryPort` interface!

---

## Key Concepts to Remember

### 1. **JWT Tokens** = Digital Badges
   - Contains user info (user_id, email)
   - Signed so it can't be tampered with
   - Has expiration date

### 2. **Access Token** = Short-lived Badge
   - Expires quickly (1 hour default)
   - Used for API requests
   - Can't be used after expiration

### 3. **Refresh Token** = Long-lived Badge
   - Expires slowly (7 days default)
   - Used to get new access tokens
   - Stored securely (in-memory for now, database in production)

### 4. **Middleware/Dependencies** = Security Checkpoint
   - Runs before route handler
   - Can block requests
   - Provides authenticated user to route

### 5. **Repository Pattern** = Data Access Abstraction
   - Interface (Port) defines what operations are possible
   - Implementation (Adapter) does the actual work
   - Easy to swap implementations (in-memory → database)

---

## Common Questions

### Q: Where are tokens stored?
**A**: Access tokens are stored on the client (browser localStorage/cookies). Refresh tokens are stored in the server's `TokenRepository` (in-memory for now).

### Q: What if I lose my refresh token?
**A**: You'll need to log in again to get a new one.

### Q: Can I use the same token forever?
**A**: No, access tokens expire after 1 hour (configurable). Use refresh_token to get new ones.

### Q: How secure is this?
**A**: For Phase 3 (learning), it's basic. Passwords are stored in plain text. In production, you'd:
- Hash passwords with bcrypt
- Store tokens in database (not memory)
- Use HTTPS only
- Add rate limiting
- Use secure httpOnly cookies

### Q: What happens when server restarts?
**A**: In-memory storage is lost. All refresh tokens become invalid. Users need to log in again.

---

## Next Steps (Phase 4)

Phase 4 will add:
- Frontend login page
- Token storage in browser
- Automatic token refresh when expired
- Route guards (protect frontend routes)

---

## Summary

Phase 3 adds **real authentication**:
1. Users log in with email/password → get tokens
2. Tokens must be sent with protected requests
3. Middleware validates tokens before allowing access
4. Refresh tokens allow getting new access tokens without re-login

Everything follows **Clean Architecture**:
- Business logic in `AuthenticationService`
- Data access in `Repositories`
- Token operations in `JWTService`
- Routes just coordinate everything

**The key insight**: Tokens are self-contained - they contain user info and expiration, signed so they can't be forged.

