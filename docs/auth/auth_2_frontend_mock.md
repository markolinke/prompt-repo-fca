# Phase 2 Authentication - Frontend Implementation (Simple Explanation)

This document explains how Phase 2 frontend authentication works in simple terms, as if you're new to the codebase.

## The Big Picture

Phase 2 adds the **frontend structure** for authentication. Just like Phase 1 built the backend frame, Phase 2 builds the frontend frame - but still uses mock authentication (no real login yet).

Think of it like this:
- **Phase 1 (Backend)**: Built the kitchen and chef (server can answer "who are you?")
- **Phase 2 (Frontend)**: Built the restaurant and waiters (client can ask "who am I?" and display it)
- **Phase 3 (Coming next)**: Will add real keys and security (actual login with real tokens)

Right now, when you click "Login" in the frontend, it calls the backend and gets a mock user. Later phases will add real Google OAuth login.

---

## What Calls What: The Dependency Flow

Think of our frontend code like a restaurant chain:

1. **Customer (User clicks button)** → Orders food
2. **Waiter (LoginPage component)** → Takes the order
3. **Store Manager (AuthStore)** → Keeps track of orders and customers
4. **Chef (AuthService)** → Prepares the order using recipes
5. **Delivery Driver (HttpAuthRepository)** → Goes to the kitchen (backend API)
6. **Kitchen (Backend `/auth/me`)** → Serves the food (user data)

Here's how it works in our code:

```
User clicks "Login" button
    ↓
LoginPage.vue (handleLogin)
    ↓
AuthStore.fetchCurrentUser()
    ↓
AuthService.getCurrentUser()
    ↓
HttpAuthRepository.getCurrentUser()
    ↓
AxiosHttpClient.get('/auth/me')
    ↓
Backend API (GET /auth/me)
    ↓
Returns User JSON
    ↓
Flows back up through all layers
    ↓
AuthStore updates state
    ↓
LoginPage shows user info
```

**Key Rule**: Each layer only talks to the layer directly below or above it, never skipping layers.

---

## What Depends on What: Clean Architecture Layers

Our frontend code is organized in layers, from outer (closest to the user) to inner (business logic):

```
┌─────────────────────────────────┐
│  Vue Components (LoginPage.vue) │  ← Outer layer: UI, user interaction
├─────────────────────────────────┤
│  Pinia Store (AuthStore)        │  ← State management, user session
├─────────────────────────────────┤
│  Service (AuthService)          │  ← Business logic
├─────────────────────────────────┤
│  Repository (HttpAuthRepository)│  ← Data access, API calls
├─────────────────────────────────┤
│  HTTP Client (AxiosHttpClient)  │  ← Network requests
└─────────────────────────────────┘
```

### Outer Layer: Components (LoginPage.vue)
- **Job**: Shows UI to user, handles button clicks
- **Knows about**: Store (via bootstrap)
- **Does NOT know**: How to fetch users, how API works

### Store Layer (AuthStore)
- **Job**: Keeps track of user state (logged in? who is the user? token?)
- **Knows about**: Service
- **Does NOT know**: How to make HTTP requests

### Service Layer (AuthService)
- **Job**: Orchestrates authentication business logic
- **Knows about**: Repository (interface)
- **Does NOT know**: Which repository is being used (HTTP vs mock)

### Repository Layer (HttpAuthRepository)
- **Job**: Makes API calls to backend
- **Knows about**: HTTP Client
- **Does NOT know**: Business logic, user state

### HTTP Client Layer (AxiosHttpClient)
- **Job**: Actually sends HTTP requests over the network
- **Knows about**: Backend URL, how to format requests
- **Does NOT know**: What the data means, business logic

---

## How Requests Work: Step-by-Step

When a user clicks the "Login" button, here's what happens:

### 1. User Clicks Button
```vue
<!-- In LoginPage.vue -->
<button @click="handleLogin">Login with Google (Mock)</button>
```

### 2. Component Handler Called
```typescript
const handleLogin = async () => {
    // Phase 2: Just fetch mock user
    await authStore.fetchCurrentUser();
};
```

### 3. Store Action Called
```typescript
// In AuthStore
async fetchCurrentUser(): Promise<void> {
    this.loading = true;  // Show loading spinner
    try {
        // Call the service
        this.user = await authService.getCurrentUser();
        this.token = 'mock-token';  // Phase 2: mock token
        this.isAuthenticated = true;
    } catch (error) {
        this.error = error.message;
    } finally {
        this.loading = false;
    }
}
```

### 4. Service Called
```typescript
// In AuthService
async getCurrentUser(): Promise<User> {
    return this.repository.getCurrentUser();
}
```

### 5. Repository Makes HTTP Call
```typescript
// In HttpAuthRepository
async getCurrentUser(): Promise<User> {
    const data = await this.httpClient.get('/auth/me');
    return User.fromPlainObject(data);
}
```

### 6. HTTP Client Sends Request
```typescript
// In AxiosHttpClient
async get(endpoint: string): Promise<any> {
    // Creates axios request
    // Injects token if getToken function is provided
    const token = this.getToken?.();  // Gets token from store
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    const response = await axios.get(baseUrl + endpoint);
    return response.data;
}
```

### 7. Backend Responds
Backend returns:
```json
{
  "id": "mock-user-1",
  "email": "john.doe@ancorit.com",
  "name": "Test User"
}
```

### 8. Response Flows Back Up
```
Backend JSON response
    ↓
HTTP Client returns data
    ↓
Repository converts to User entity
    ↓
Service returns User
    ↓
Store updates state (user, token, isAuthenticated)
    ↓
Component reactively updates UI (shows user info)
```

---

## Routes Added and Their Purpose

### New Route: `/login`

**Purpose**: Shows the login page where users can authenticate.

**What it does**:
1. Displays a login button
2. When clicked, calls `authStore.fetchCurrentUser()`
3. Shows user info after successful login

**File**: `domains/auth/routes.ts`

```typescript
{
  path: '/login',
  name: 'login',
  component: () => import('@/domains/auth/components/LoginPage.vue'),
}
```

**How to access**: Navigate to `http://localhost:5173/login` in your browser.

**Note**: In Phase 2, clicking login always succeeds and shows a mock user. In Phase 3, this will redirect to real Google OAuth.

---

## Sequence of Execution: Startup and User Interaction

### When App Starts (Bootstrap)

1. **main.ts** runs when app loads
2. `bootstrapDependencies()` is called:
   - Creates base HTTP client (no token)
   - Registers it in `appDependencies`
3. `bootstrapFeatures()` is called:
   - Calls `bootstrapAuth()`
   - Creates auth domain structure:
     ```typescript
     // Step 1: Create repository (talks to backend)
     const repository = new HttpAuthRepository(baseHttpClient);
     
     // Step 2: Create service (business logic)
     const service = new AuthService(repository);
     
     // Step 3: Create store (state management)
     const useStore = createAuthStore(service);
     
     // Step 4: Create authenticated HTTP client
     // (with token provider for future use)
     const authenticatedHttpClient = new AxiosHttpClient(
         baseUrl,
         {},
         router,
         () => useStore().getToken()  // Gets token from store when needed
     );
     
     // Step 5: Create authenticated repository/service/store
     // (ready for Phase 3 when tokens are required)
     const authenticatedRepository = new HttpAuthRepository(authenticatedHttpClient);
     const authenticatedService = new AuthService(authenticatedRepository);
     const authenticatedStore = createAuthStore(authenticatedService);
     ```
   - Registers `/login` route
4. Route guards are set up (non-enforcing in Phase 2)
5. Router is installed: `app.use(router)`
6. Pinia is installed: `app.use(pinia)`
7. App mounts: `app.mount('#app')`

### When User Clicks Login

1. **User action**: Clicks "Login with Google (Mock)" button
2. **Component**: `handleLogin()` function runs
3. **Store**: `authStore.fetchCurrentUser()` is called
4. **Store sets loading**: `this.loading = true` (UI shows spinner)
5. **Service**: `authService.getCurrentUser()` is called
6. **Repository**: `repository.getCurrentUser()` is called
7. **HTTP Client**: Makes `GET /auth/me` request to backend
   - Token is injected if store has one (Phase 2: "mock-token")
8. **Backend**: Returns mock user JSON
9. **Repository**: Converts JSON to `User` entity
10. **Service**: Returns `User` to store
11. **Store updates state**:
    - `this.user = user`
    - `this.token = 'mock-token'`
    - `this.isAuthenticated = true`
    - `this.loading = false`
12. **Component reactively updates**: UI shows user info

---

## Route Guards: What They Are and How They Work

### Simple Explanation

**Route guards** are like security guards at building entrances. Before you can enter a room (route), the guard checks your ID (authentication). In our case, the route guard checks if you're logged in before letting you access protected pages.

### In Vue Router: `beforeEach`

Vue Router has a `beforeEach` hook that runs before navigating to any route. It's like a checkpoint that every navigation must pass through.

```typescript
router.beforeEach((to, from, next) => {
    // This runs BEFORE every route change
    
    // 'to' = where you're going
    // 'from' = where you're coming from
    // 'next' = function to continue navigation
    
    next();  // Allow navigation to continue
});
```

### How Our Route Guards Work (Phase 2)

In Phase 2, route guards are set up but **non-enforcing** (they don't actually block anyone):

```typescript
router.beforeEach((_to, _from, next) => {
    // Phase 2: Structure only - don't enforce yet
    // Phase 3: Check auth state and redirect to login if needed
    // const authStore = authBootstrap.useStore();
    // if (_to.meta.requiresAuth && !authStore.isAuthenticated) {
    //   next({ name: 'login' });  // Redirect to login
    // } else {
    //   next();  // Allow access
    // }
    
    next();  // Always allow in Phase 2
});
```

**What will happen in Phase 3**:
- Check if route requires authentication (`to.meta.requiresAuth`)
- Check if user is logged in (`authStore.isAuthenticated`)
- If not logged in and route requires auth → redirect to `/login`
- Otherwise → allow access

### Visual Flow

```
User navigates to /notes
    ↓
Router.beforeEach runs
    ↓
Check: Is route protected? (Phase 3)
    ↓
Check: Is user logged in? (Phase 3)
    ↓
If yes → next() (allow)
If no → next({ name: 'login' }) (redirect)
    ↓
Route loads
```

---

## Token Injection: How It Works

### The Problem

Some API calls need authentication (like `/auth/me`), others don't (like `/health`). We need a way to automatically add the `Authorization: Bearer <token>` header to requests that need it.

### The Solution: Token Provider Function

Instead of storing a static token, we use a **function** that gets the token when needed:

```typescript
// In AxiosHttpClient constructor
constructor(
    baseUrl: string,
    headers: Record<string, string>,
    router: MyRouterPort,
    getToken?: () => string | null  // Function that returns token
)

// When making requests:
private createClient(): AxiosInstance {
    const token = this.getToken?.();  // Call function to get current token
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    return axios.create(config);
}
```

### How Token Provider Is Created

In `bootstrapAuth()`:

```typescript
const authenticatedHttpClient = new AxiosHttpClient(
    baseUrl,
    {},
    router,
    () => useStore().getToken()  // Function that reads from store
);
```

**Why a function?**
- Token can change (login, logout)
- Store might not be ready during bootstrap
- Function is called **lazily** when request is made (after Pinia is active)

### Flow of Token Injection

```
User clicks Login
    ↓
Store updates: token = 'mock-token'
    ↓
Repository makes API call
    ↓
HTTP Client.createClient() runs
    ↓
Calls getToken() function
    ↓
Function reads from store: useStore().getToken()
    ↓
Returns 'mock-token'
    ↓
Adds header: Authorization: Bearer mock-token
    ↓
Request sent to backend
```

**Note**: In Phase 2, backend ignores the token (always returns mock user). But the infrastructure is ready for Phase 3 when tokens will be validated.

---

## Domain Structure

### Files Created

```
applications/frontend-app/src/domains/auth/
├── entities/
│   └── User.ts                    # User entity (matches backend)
├── repositories/
│   ├── AuthRepositoryPort.ts     # Interface for auth API calls
│   └── HttpAuthRepository.ts     # HTTP implementation
├── services/
│   └── AuthService.ts            # Business logic
├── store/
│   └── AuthStore.ts              # Pinia store (state management)
├── components/
│   └── LoginPage.vue             # Login page UI
├── routes.ts                     # Route definitions
├── bootstrap.ts                  # Wires everything together
└── index.ts                      # Exports bootstrap
```

### Key Concepts

#### 1. User Entity
- Matches backend User structure
- Has `id`, `email`, `name`
- Has `fromPlainObject()` to create from JSON

#### 2. AuthStore (Pinia)
- **State**: `user`, `token`, `isAuthenticated`, `loading`, `error`
- **Actions**: `fetchCurrentUser()`, `logout()`
- **Getters**: `getToken()` - returns function to get current token

#### 3. Bootstrap Pattern
- Every domain has a `bootstrap.ts` file
- Creates all dependencies in correct order
- Wires them together
- Returns store and routes for app to use

---

## Hands-On Learning Exercises

### Exercise 1: See the Login Flow in Action

**Goal**: Understand the complete flow from button click to user display.

**Steps**:
1. Start backend: `cd services/notes-service && python run.py`
2. Start frontend: `cd applications/frontend-app && npm run dev`
3. Open browser: `http://localhost:5173/login`
4. Open DevTools → Network tab
5. Click "Login with Google (Mock)" button
6. Watch the network request:
   - Should see `GET /auth/me`
   - Check Headers → Request Headers
   - Should see `Authorization: Bearer mock-token`
7. Check DevTools → Vue tab (if Vue DevTools installed):
   - See Pinia store update
   - See `auth` store state change

**What you learned**: How clicking a button triggers a chain of calls through all layers.

---

### Exercise 2: Inspect Store State

**Goal**: Understand how the store manages authentication state.

**Steps**:
1. After logging in, open browser console
2. Access store programmatically:
   ```javascript
   // In browser console
   import { useAuthStore } from '@/domains/auth/store/AuthStore';
   const store = useAuthStore();
   console.log(store.user);
   console.log(store.token);
   console.log(store.isAuthenticated);
   ```
3. Or use Vue DevTools to inspect store

**What you learned**: How state is managed and can be accessed anywhere in the app.

---

### Exercise 3: Trace the Dependency Flow Manually

**Goal**: Understand how dependencies are wired together.

**Steps**:
1. Start at `src/app/main.ts` - entry point
2. Follow to `bootstrapFeatures()` in `app/bootstrap/bootstrapFeatures.ts`
3. See it calls `bootstrapAuth()` from `domains/auth/bootstrap.ts`
4. Trace bootstrap creation:
   - Repository created with base HTTP client
   - Service created with repository
   - Store created with service
   - Authenticated client created with token provider
   - Authenticated repository/service/store created
5. See routes registered: `authRoutes` from `domains/auth/routes.ts`
6. See component loaded: `LoginPage.vue`

**Draw the flow** on paper - this visualization helps cement understanding.

**What you learned**: How Clean Architecture layers connect via dependency injection.

---

### Exercise 4: Modify LoginPage to Show User Info

**Goal**: See how components react to store state changes.

**Steps**:
1. Open `domains/auth/components/LoginPage.vue`
2. Add user display after login:
   ```vue
   <template>
     <div class="login-page">
       <h1>Login</h1>
       <button @click="handleLogin">Login with Google (Mock)</button>
       
       <!-- Add this -->
       <div v-if="authStore.user">
         <h2>Logged in as:</h2>
         <p>Name: {{ authStore.user.name }}</p>
         <p>Email: {{ authStore.user.email }}</p>
         <p>Token: {{ authStore.token }}</p>
         <button @click="handleLogout">Logout</button>
       </div>
     </div>
   </template>
   
   <script setup lang="ts">
   import { bootstrapAuth } from '@/domains/auth';
   
   const bootstrap = bootstrapAuth();
   const authStore = bootstrap.useStore();
   
   const handleLogin = async () => {
       await authStore.fetchCurrentUser();
   };
   
   const handleLogout = () => {
       authStore.logout();
   };
   </script>
   ```
3. Test it: Login should show user info, logout should hide it

**What you learned**: How Vue reactivity connects store state to UI.

---

### Exercise 5: Add Logging to Understand Execution Order

**Goal**: See the actual sequence of code execution.

**Steps**:
1. Add `console.log()` at key points:

   In `LoginPage.vue`:
   ```typescript
   const handleLogin = async () => {
       console.log('[LoginPage] Button clicked');
       await authStore.fetchCurrentUser();
       console.log('[LoginPage] Login complete');
   };
   ```

   In `AuthStore.ts`:
   ```typescript
   async fetchCurrentUser(): Promise<void> {
       console.log('[Store] fetchCurrentUser called');
       this.loading = true;
       try {
           console.log('[Store] Calling service...');
           this.user = await authService.getCurrentUser();
           console.log('[Store] User received:', this.user);
           this.token = 'mock-token';
           this.isAuthenticated = true;
       } catch (error) {
           console.error('[Store] Error:', error);
       } finally {
           this.loading = false;
           console.log('[Store] Done');
       }
   }
   ```

   In `AuthService.ts`:
   ```typescript
   async getCurrentUser(): Promise<User> {
       console.log('[Service] getCurrentUser called');
       const user = await this.repository.getCurrentUser();
       console.log('[Service] User from repository:', user);
       return user;
   }
   ```

   In `HttpAuthRepository.ts`:
   ```typescript
   async getCurrentUser(): Promise<User> {
       console.log('[Repository] Making HTTP call to /auth/me');
       const data = await this.httpClient.get('/auth/me');
       console.log('[Repository] Received data:', data);
       return User.fromPlainObject(data);
   }
   ```

2. Click login and watch console output - you'll see the exact order!

**What you learned**: The actual sequence of code execution in a user action.

---

### Exercise 6: Test Token Injection

**Goal**: Verify tokens are injected into requests.

**Steps**:
1. Open DevTools → Network tab
2. Click login button
3. Find the `/auth/me` request
4. Click on it → Headers tab
5. Look at Request Headers
6. Should see: `Authorization: Bearer mock-token`

**Advanced**: Modify `AuthStore.fetchCurrentUser()` to set a different token:
```typescript
this.token = 'my-test-token-123';
```

Then check Network tab again - should see the new token in headers.

**What you learned**: How tokens flow from store → HTTP client → request headers.

---

### Exercise 7: Create a Protected Component (Structure Only)

**Goal**: Understand how route guards will work in Phase 3.

**Steps**:
1. Create a simple component that shows user info:
   ```vue
   <!-- domains/auth/components/UserProfile.vue -->
   <template>
     <div>
       <h1>My Profile</h1>
       <div v-if="authStore.user">
         <p>{{ authStore.user.name }}</p>
         <p>{{ authStore.user.email }}</p>
       </div>
       <div v-else>
         <p>Not logged in</p>
       </div>
     </div>
   </template>
   
   <script setup lang="ts">
   import { bootstrapAuth } from '@/domains/auth';
   
   const bootstrap = bootstrapAuth();
   const authStore = bootstrap.useStore();
   </script>
   ```
2. Add route in `routes.ts`:
   ```typescript
   {
     path: '/profile',
     name: 'profile',
     component: () => import('@/domains/auth/components/UserProfile.vue'),
     meta: { requiresAuth: true }  // Phase 3: Will check this
   }
   ```
3. Navigate to `/profile` - works in Phase 2 (guards non-enforcing)
4. In Phase 3, this route will require login

**What you learned**: How protected routes are structured for Phase 3.

---

### Exercise 8: Understand Bootstrap Order

**Goal**: See why things must be created in a specific order.

**Steps**:
1. Look at `bootstrapAuth()` order:
   - Why is repository created before service?
   - Why is service created before store?
   - Why is authenticated client created with a function, not direct token?

2. Try breaking it:
   ```typescript
   // This would break - why?
   const service = new AuthService(repository);  // repository doesn't exist yet!
   const repository = new HttpAuthRepository(baseHttpClient);
   ```

3. Think about what happens if you try to use store before Pinia is installed

**What you learned**: Dependency order matters - each layer depends on the one below it.

---

### Exercise 9: Compare Frontend and Backend Architecture

**Goal**: See how frontend mirrors backend Clean Architecture.

**Steps**:
1. Compare structures:

   **Backend (Phase 1)**:
   - Routes → Middleware → Service → Provider
   
   **Frontend (Phase 2)**:
   - Component → Store → Service → Repository → HTTP Client

2. Notice similarities:
   - Both have service layer (business logic)
   - Both have abstraction layers (Provider/Repository ports)
   - Both use dependency injection
   - Both have bootstrap pattern

3. Notice differences:
   - Frontend has Store (state management) - backend is stateless
   - Frontend has Components (UI) - backend has Routes (API)
   - Frontend makes HTTP requests - backend handles them

**What you learned**: Clean Architecture principles apply to both frontend and backend.

---

### Exercise 10: Read the Source Code Systematically

**Goal**: Become comfortable navigating the codebase.

**Steps**:
1. Start at `src/app/main.ts` - the entry point
2. Follow imports to understand what gets imported where
3. Read each file in the auth domain in this order:
   - `entities/User.ts` - The data model
   - `repositories/AuthRepositoryPort.ts` - The interface
   - `repositories/HttpAuthRepository.ts` - The implementation
   - `services/AuthService.ts` - The business logic
   - `store/AuthStore.ts` - The state management
   - `components/LoginPage.vue` - The UI
   - `routes.ts` - The route definitions
   - `bootstrap.ts` - The wiring

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
# Start backend
cd services/notes-service
source env/bin/activate
python run.py

# Start frontend (in new terminal)
cd applications/frontend-app
npm run dev

# Test login page
# Navigate to: http://localhost:5173/login

# Test backend directly
curl http://localhost:8000/auth/me

# With token (Phase 2: ignored, but header is sent)
curl -H "Authorization: Bearer mock-token" http://localhost:8000/auth/me
```

---

## What's Next: Phase 3

In Phase 3, we'll add real authentication:
- Real JWT tokens from Google OAuth
- Token validation on backend
- Enforcing route guards
- Redirecting unauthenticated users to login
- Token refresh logic

But the architecture will stay the same - that's the beauty of Clean Architecture! We'll just swap the mock provider with a real one.

---

## Phase 2 Summary - Quick Reference

### What We Built
- **Auth domain structure** following Clean Architecture patterns
- **Frontend auth store** for managing user state
- **Token injection infrastructure** (ready for Phase 3)
- **Login page** with mock authentication
- **Route guards** (structure only, non-enforcing)

### Key Files Created
```
domains/auth/
├── entities/User.ts                    # User entity
├── repositories/
│   ├── AuthRepositoryPort.ts          # Interface
│   └── HttpAuthRepository.ts          # HTTP implementation
├── services/AuthService.ts             # Business logic
├── store/AuthStore.ts                  # Pinia store
├── components/LoginPage.vue            # Login UI
├── routes.ts                           # Route definitions
└── bootstrap.ts                        # Dependency wiring
```

### Key Concepts Learned
- **Clean Architecture layers**: Components → Store → Service → Repository → HTTP Client
- **Dependency Injection**: Dependencies flow inward, passed via constructor
- **Pinia Store**: State management with reactive updates
- **Token Provider Pattern**: Function-based token injection for dynamic tokens
- **Bootstrap Pattern**: Wire dependencies at app startup
- **Route Guards**: Intercept navigation for authentication checks

### Current State
- ✅ Frontend auth architecture in place
- ✅ Mock authentication works (click login → get mock user)
- ✅ Token injection ready (infrastructure for Phase 3)
- ✅ Route guards structure ready (non-enforcing)
- ✅ Ready for Phase 3 (real OAuth integration)

### Testing
```bash
# Manual test
npm run dev
# Navigate to http://localhost:5173/login
# Click "Login with Google (Mock)"
# Should see user info

# Check Network tab
# Should see GET /auth/me with Authorization header
```

**Note**: Phase 2 has no real authentication - it's all mock. Real OAuth login comes in Phase 3.

---

## Common Questions

### Q: Why do we create both base and authenticated repositories?
**A**: For Phase 2, we only need the base one (backend doesn't require tokens). But we're setting up the infrastructure for Phase 3 when authenticated requests will be needed. The authenticated repository uses an HTTP client that automatically injects tokens.

### Q: Why use a function for token (`getToken`) instead of storing it directly?
**A**: The token can change (login, logout). A function is called **when the request is made**, ensuring we always get the current token value. Also, the store might not be ready during bootstrap, so lazy access via function avoids timing issues.

### Q: Can I access the auth store from any component?
**A**: Yes! Import `bootstrapAuth` and call `useStore()`:
```typescript
import { bootstrapAuth } from '@/domains/auth';
const authStore = bootstrapAuth().useStore();
```

### Q: What happens if I call an API without being logged in?
**A**: In Phase 2, nothing special - backend returns mock user anyway. In Phase 3, backend will return 401 Unauthorized, and the route guard will redirect you to login.

### Q: Why do route guards call `next()` in Phase 2?
**A**: Phase 2 guards are **non-enforcing** - they're just structure. They call `next()` to allow all navigation. In Phase 3, they'll check authentication and redirect if needed.

---

## Troubleshooting

### Store shows "no active Pinia"
**Problem**: You're trying to use store before `app.use(pinia)` is called.

**Solution**: Make sure Pinia is installed before accessing stores. Store access should happen in components after app mount, or in route guards after router is set up.

### Token not being sent in requests
**Problem**: HTTP client isn't receiving token provider function.

**Solution**: Check that authenticated HTTP client is created with token provider:
```typescript
new AxiosHttpClient(baseUrl, {}, router, () => useStore().getToken())
```

### Login button does nothing
**Problem**: Check browser console for errors.

**Common causes**:
- Backend not running
- CORS issues (check backend CORS config)
- Network request failing (check Network tab)

---

**Remember**: When in doubt, check the `notes` domain - it's the reference implementation for all patterns. The auth domain follows the same structure!
