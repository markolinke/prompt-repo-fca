# Phase 4.1: Frontend JWT Token Storage & Management Infrastructure

## What Did Phase 4.1 Build?

Phase 4.1 created the **foundation** for JWT token management in our frontend. Think of it as building the "vault" where we'll store authentication tokens. We haven't implemented login yet (that's Phase 4.2), but we've built all the infrastructure to **store, retrieve, and manage** tokens securely.

---

## The Big Picture: What We're Building

Imagine you're building a hotel:

- **Phase 4.1** = Building the safe where room keys (tokens) will be stored
- **Phase 4.2** = The front desk that gives out keys (login)
- **Phase 4.3** = Automatic key renewal (token refresh)
- **Phase 4.4** = Security guards checking keys (route guards)

Right now, we have a working safe, but we haven't built the front desk yet. But when we do, everything will plug right in!

---

## Architecture: How the Pieces Fit Together

Our code follows **Clean Architecture**, which means we organize code into layers. Each layer has a specific job:

```text
┌─────────────────────────────────────────┐
│  PRESENTATION LAYER (Store/UI)          │
│  - AuthStore: Reacts to user actions    │
│  - Components: LoginPage, etc.          │
└─────────────────────────────────────────┘
                    ↓ depends on
┌─────────────────────────────────────────┐
│  APPLICATION LAYER (Services)            │
│  - AuthService: Business logic for auth │
│  - TokenService: Business logic for tokens│
└─────────────────────────────────────────┘
                    ↓ depends on
┌─────────────────────────────────────────┐
│  DATA LAYER (Repositories)               │
│  - HttpAuthRepository: Talks to backend │
│  - TokenRepositoryPort: Interface       │
│  - LocalStorageTokenRepository: Storage │
└─────────────────────────────────────────┘
```

### Key Principle: Dependencies Flow DOWNWARD

- **Stores** (top) can use **Services**
- **Services** can use **Repositories**
- **Repositories** can use **HTTP clients** or **localStorage**
- **But NOT the other way around!**

Think of it like a pyramid: higher layers know about lower layers, but lower layers are "blind" to what's above them.

---

## What Calls What: The Dependency Chain

### 1. **Bootstrap Phase** (When App Starts)

When your app first loads, here's what happens:

```text
main.ts
  ↓
bootstrapDependencies()  → Sets up HTTP client, router, config
  ↓
bootstrapFeatures()      → Sets up all features (auth, notes, etc.)
  ↓
bootstrapAuth()          → Creates all auth pieces
```

**In `bootstrapAuth()` (the auth setup function):**

```typescript
// Step 1: Create the "storage box" (repository)
const tokenRepository = new LocalStorageTokenRepository();

// Step 2: Create the "service" that knows HOW to use the storage
const tokenService = new TokenService(tokenRepository);

// Step 3: Create the "store" that the UI will use
const useStore = createAuthStore(authService, tokenService);
```

**Think of it like this:**

- **Repository** = The actual safe (localStorage)
- **Service** = The manager who knows how to use the safe
- **Store** = The front desk that customers interact with

### 2. **When User Interacts** (Later, when we add login)

```text
User clicks "Login" button
  ↓
LoginPage component calls: authStore.login(email, password)
  ↓
AuthStore.login() calls: authService.login(email, password)
  ↓
AuthService calls: httpAuthRepository.login(credentials)
  ↓
HttpAuthRepository makes HTTP POST to backend: /auth/login
  ↓
Backend returns: { accessToken: "...", refreshToken: "..." }
  ↓
AuthStore receives tokens and calls: tokenService.setAccessToken(token)
  ↓
TokenService calls: tokenRepository.setAccessToken(token)
  ↓
TokenRepository saves to: localStorage.setItem('auth_access_token', token)
```

**Result:** Token is now stored in browser's localStorage!

### 3. **When Making API Requests**

```text
Component needs data → calls: authStore.fetchCurrentUser()
  ↓
AuthStore calls: authService.getCurrentUser()
  ↓
AuthService calls: httpAuthRepository.getCurrentUser()
  ↓
HttpAuthRepository calls: httpClient.get('/auth/me')
  ↓
HttpClient (AxiosHttpClient) checks: getToken() → Gets token from store
  ↓
HttpClient adds header: Authorization: Bearer <token>
  ↓
Request sent to backend with token!
```

---

## Files and Their Jobs

### **Repository Layer** (Storage/Data Access)

**`TokenRepositoryPort.ts`** - The "contract"

```typescript
// This is like a job description. It says:
// "Anyone who wants to store tokens must have these methods"
export interface TokenRepositoryPort {
    setAccessToken(token: string): void;
    getAccessToken(): string | null;
    // ... etc
}
```

**`LocalStorageTokenRepository.ts`** - The "worker" (real implementation)

```typescript
// This is the actual worker who stores tokens in browser localStorage
export class LocalStorageTokenRepository implements TokenRepositoryPort {
    setAccessToken(token: string): void {
        localStorage.setItem('auth_access_token', token); // Saves to browser
    }
    // ... implements all methods from the "contract"
}
```

**`MockTokenRepository.ts`** - The "test worker"

```typescript
// Same "contract", but stores in memory (for testing)
export class MockTokenRepository implements TokenRepositoryPort {
    private accessToken: string | null = null; // Just stores in memory
    
    setAccessToken(token: string): void {
        this.accessToken = token; // No localStorage, just memory
    }
}
```

**Why two implementations?**

- **LocalStorageTokenRepository**: Real app - persists across page refreshes
- **MockTokenRepository**: Tests - clears when test ends, no side effects

### **Service Layer** (Business Logic)

**`TokenService.ts`** - The "manager"

```typescript
// This is a thin wrapper around the repository
// It doesn't add much logic yet, but it COULD in the future
// (e.g., "if token is expired, don't save it")
export class TokenService {
    constructor(private readonly tokenRepository: TokenRepositoryPort) {}
    
    setAccessToken(token: string): void {
        this.tokenRepository.setAccessToken(token); // Just passes through
    }
}
```

**Why have this if it just passes through?**

- **Clean Architecture**: Store shouldn't talk to Repository directly
- **Future flexibility**: We might add validation, logging, or other logic here
- **Consistency**: Same pattern as `AuthService` and `NoteService`

### **Store Layer** (UI State Management)

**`AuthStore.ts`** - The "front desk"

```typescript
// This is what Vue components will use
export const createAuthStore = (authService, tokenService) => {
    return defineStore('auth', {
        state: () => ({
            accessToken: null,      // Current token in memory
            refreshToken: null,     // Refresh token in memory
            isAuthenticated: false, // Are we logged in?
            user: null,             // Current user info
        }),
        
        actions: {
            // When app starts, check if we have saved tokens
            initializeAuth(): void {
                const token = tokenService.getAccessToken(); // Get from storage
                if (token && !isTokenExpired(token)) {
                    this.accessToken = token; // Restore to memory
                    this.isAuthenticated = true;
                }
            },
            
            // Save tokens (will be called after login in Phase 4.2)
            setTokens(accessToken: string, refreshToken: string): void {
                this.accessToken = accessToken;              // Save to memory
                this.refreshToken = refreshToken;
                tokenService.setAccessToken(accessToken);    // Save to localStorage
                tokenService.setRefreshToken(refreshToken);
                this.isAuthenticated = true;
            }
        }
    });
};
```

**Important:** Tokens exist in TWO places:

1. **Store state** (memory) - Fast access for current session
2. **localStorage** (disk) - Persists when page refreshes

---

## How HTTP Requests Work with Tokens

### The Token Injection System

When we make an API request, we need to send the token. Here's how it works:

**1. Create HTTP Client with Token Getter**

```typescript
// In bootstrapAuth():
const authenticatedHttpClient = new AxiosHttpClient(
    baseUrl,
    {},
    router,
    () => tokenGetter?.() || null  // Function that gets token from store
);
```

**2. HTTP Client Adds Token to Requests**

```typescript
// In AxiosHttpClient.createClient():
private createClient(params: object = {}): AxiosInstance {
    const token = this.getToken?.(); // Call the getter function
    
    if (token) {
        config.headers.Authorization = `Bearer ${token}`; // Add to header
    }
    
    return axios.create(config);
}
```

**3. Token Getter Reads from Store**

```typescript
// In bootstrapAuth():
const store = useStore();
tokenGetter = () => {
    return store.getToken()(); // Gets token from store state
};
```

**Flow diagram:**

```text
Component makes request
  ↓
Repository calls: httpClient.get('/auth/me')
  ↓
HttpClient calls: getToken() function
  ↓
getToken() reads: store.getToken()()
  ↓
Returns: "eyJhbGc..." (the token)
  ↓
HttpClient adds: Authorization: Bearer eyJhbGc...
  ↓
Request sent to backend!
```

---

## Routes: What Pages We Have

### Current Routes (Phase 4.1)

**`/login`** - Login page
- Component: `LoginPage.vue`
- Purpose: Where users will log in (login functionality not implemented yet in Phase 4.1)
- Status: Page exists, but login action doesn't work yet (Phase 4.2 will add that)

**How routes are registered:**
```typescript
// In domains/auth/routes.ts:
export default [
    { path: '/login', name: 'login', component: () => import('./components/LoginPage.vue') }
];

// In bootstrapFeatures():
for (const route of authBootstrap.routes) {
    router.addRoute(route); // Adds to Vue Router
}
```

---

## Execution Sequence: What Happens When App Starts

Here's the **step-by-step** sequence when your app loads:

### Step 1: App Initialization (`main.ts`)
```typescript
const app = createApp(App); // Create Vue app
```

### Step 2: Register Dependencies (`bootstrapDependencies`)
```typescript
// Sets up global infrastructure
- HTTP Client (without auth token - base client)
- Router wrapper
- App configuration
```

### Step 3: Bootstrap Features (`bootstrapFeatures`)
```typescript
// Sets up each feature (notes, auth, etc.)
bootstrapAuth() is called here
```

### Step 4: Auth Bootstrap (`bootstrapAuth`)
```typescript
// Creates all auth pieces:
1. TokenRepository (storage - localStorage or mock)
   ↓
2. TokenService (wraps repository)
   ↓
3. HttpAuthRepository (talks to backend)
   ↓
4. AuthService (wraps auth repository)
   ↓
5. AuthStore (wraps services - UI uses this)
   ↓
6. AuthenticatedHttpClient (HTTP client with token injection)
   ↓
7. Routes are returned
```

### Step 5: Router Setup
```typescript
// Routes from all features are added to Vue Router
router.addRoute(loginRoute);
router.addRoute(homeRoute);
// etc.
```

### Step 6: App Mounts
```typescript
app.use(router);
app.use(pinia); // Store system
app.mount('#app'); // Actually renders to DOM
```

### Step 7: Auth Initialization (NOT YET AUTOMATIC)

Currently, `initializeAuth()` is **not called automatically**. In Phase 4.4, we'll add this:

```typescript
// Future (Phase 4.4):
authBootstrap.initializeAuth(); // Check localStorage for saved tokens
```

---

## Understanding Middleware (Concept for Future Phases)

**Middleware** is code that runs "in the middle" of requests or navigation.

### Route Guard Middleware (Coming in Phase 4.4)

**What it does:** Checks if user is logged in before allowing access to pages.

**How it works:**
```typescript
// In main.ts (future):
router.beforeEach((to, from, next) => {
    const authStore = authBootstrap.useStore();
    
    // If route requires auth AND user is not logged in
    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        next({ name: 'login' }); // Redirect to login
    } else {
        next(); // Allow navigation
    }
});
```

**Visual flow:**
```
User tries to visit /notes
  ↓
Router.beforeEach() runs
  ↓
Checks: Is user authenticated?
  ↓
NO → Redirect to /login
YES → Allow access to /notes
```

### HTTP Request Middleware (Already Working!)

The `AxiosHttpClient` already acts as middleware for HTTP requests:

```typescript
// Before sending request:
1. Check if token exists (getToken())
2. If yes, add Authorization header
3. Send request
4. If 401 error, handle it (future: refresh token)
```

---

## Token Utilities: Helper Functions

We created utilities to work with JWT tokens:

### `decodeJWT(token: string)`
**What it does:** Extracts information from a JWT token without verifying it.

**Example:**
```typescript
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0...";
const payload = decodeJWT(token);
// Returns: { sub: "1234567890", exp: 1234567890, email: "user@example.com" }
```

**How it works:** JWT tokens have 3 parts separated by dots (`.`):
- Part 1: Header (algorithm info)
- Part 2: Payload (user data) ← We decode this
- Part 3: Signature (verification)

We decode the payload (middle part) which is base64-encoded JSON.

### `isTokenExpired(token: string)`
**What it does:** Checks if token is expired or will expire soon.

**Example:**
```typescript
if (isTokenExpired(token)) {
    // Token expired, need to refresh or re-login
    store.clearAuth();
}
```

**How it works:**
1. Decodes token to get `exp` (expiration timestamp)
2. Compares with current time
3. Includes 60-second buffer (if expires in next minute, consider expired)

### `getTokenExpirationTime(token: string)`
**What it does:** Gets the exact expiration time in milliseconds.

---

## How to Experiment and Learn

### Exercise 1: See Tokens in Browser Storage

1. Open your app in browser
2. Open Developer Tools (F12)
3. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
4. Click **Local Storage** → your domain
5. You'll see `auth_access_token` and `auth_refresh_token` (once login is implemented)

**Try this:**
- Manually add a token: `localStorage.setItem('auth_access_token', 'test-token')`
- Refresh page
- In console: `JSON.parse(atob(localStorage.getItem('auth_access_token').split('.')[1]))`

### Exercise 2: Trace Token Flow

**Add console.logs to understand flow:**

```typescript
// In TokenRepository:
setAccessToken(token: string): void {
    console.log('🔐 TokenRepository: Saving token to localStorage');
    localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
}

// In TokenService:
setAccessToken(token: string): void {
    console.log('📦 TokenService: Received token, passing to repository');
    this.tokenRepository.setAccessToken(token);
}

// In AuthStore:
setTokens(accessToken: string, refreshToken: string): void {
    console.log('🏪 AuthStore: Saving tokens');
    tokenService.setAccessToken(accessToken);
}
```

**Then:** When login works (Phase 4.2), you'll see the complete flow in console!

### Exercise 3: Test Token Utilities

**In browser console:**
```javascript
// Import or paste the decodeJWT function
const token = "your.jwt.token.here";
const payload = decodeJWT(token);
console.log('Token expires at:', new Date(payload.exp * 1000));
console.log('User ID:', payload.sub);
console.log('Is expired?', isTokenExpired(token));
```

### Exercise 4: Understand the Dependency Chain

**Draw the flow:**

1. Start with `AuthStore.setTokens()`
2. Follow each call:
   - `AuthStore` → calls → `TokenService`
   - `TokenService` → calls → `TokenRepository`
   - `TokenRepository` → calls → `localStorage`
3. Trace it backwards: How does `AuthStore` get the token when initializing?

### Exercise 5: Create Your Own Token Repository

**Try implementing `SessionStorageTokenRepository`:**

```typescript
export class SessionStorageTokenRepository implements TokenRepositoryPort {
    // Same interface, but use sessionStorage instead of localStorage
    setAccessToken(token: string): void {
        sessionStorage.setItem('auth_access_token', token);
    }
    // ... implement all methods
}
```

**Then:** Change bootstrap to use it and see the difference:
- `localStorage` = persists even after browser closes
- `sessionStorage` = clears when browser tab closes

---

## Key Concepts Summary

### 1. **Separation of Concerns**
Each layer has ONE job:
- **Repository** = Store/retrieve data
- **Service** = Business logic
- **Store** = UI state management

### 2. **Dependency Injection**
We "inject" dependencies through constructors:
```typescript
const repository = new TokenRepository();
const service = new TokenService(repository); // Inject repository
const store = createAuthStore(authService, tokenService); // Inject services
```

### 3. **Interface/Port Pattern**
Repositories implement an interface, so we can swap implementations:
```typescript
// Can swap between:
new LocalStorageTokenRepository()  // Real storage
new MockTokenRepository()          // Test storage
```

### 4. **Token Lifecycle**

**Phase 4.1 (Current):**
1. ✅ Store tokens (when login happens)
2. ✅ Retrieve tokens (when app starts)
3. ✅ Check expiration
4. ✅ Clear tokens (on logout)

**Phase 4.2 (Next):**
- Login will call `setTokens()`
- Store will persist tokens

**Phase 4.3 (Future):**
- Automatic token refresh
- Handle expired tokens

**Phase 4.4 (Future):**
- Route guards
- Auto-initialize on app start

---

## Common Questions

### Q: Why do we store tokens in TWO places (store state AND localStorage)?

**A:** 
- **localStorage**: Persists when page refreshes. User stays logged in.
- **Store state**: Fast access during current session. No need to read from disk every time.

### Q: Why can't the Store directly use TokenRepository?

**A:** Clean Architecture principle: Higher layers (Store) should depend on services, not infrastructure (Repositories). This makes code testable and flexible.

### Q: What happens if localStorage is disabled?

**A:** `localStorage.setItem()` will throw an error. We should add error handling in Phase 4.2 to gracefully handle this.

### Q: How does the HTTP client know which token to use?

**A:** When creating `AxiosHttpClient`, we pass a function `getToken()` that reads from the store. This function is called **on every request** to get the latest token.

---

## Next Steps: Phase 4.2

In Phase 4.2, we'll add:
1. **Login functionality** - Call backend `/auth/login`
2. **Token persistence** - Actually save tokens after login
3. **Auto-fetch user** - Get user info after login

But all the infrastructure is ready! We just need to plug in the login flow.

---

## Quick Reference: File Structure

```
domains/auth/
├── repositories/
│   ├── TokenRepositoryPort.ts          ← Interface (contract)
│   ├── LocalStorageTokenRepository.ts  ← Real implementation
│   └── MockTokenRepository.ts          ← Test implementation
├── services/
│   └── TokenService.ts                 ← Business logic wrapper
├── store/
│   └── AuthStore.ts                    ← UI state management
├── utils/
│   └── tokenUtils.ts                   ← JWT helpers
└── bootstrap.ts                        ← Wires everything together
```

---

**Remember:** Phase 4.1 built the foundation. The login UI might not work yet, but all the plumbing is in place. When we add login in Phase 4.2, it will "just work" because we've prepared everything!
