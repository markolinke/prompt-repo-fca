---
name: "Phase 4.4: Route Guards & Protected Routes"
overview: Implement route guards to protect authenticated routes, restore auth state on app initialization, and handle login redirects for unauthenticated users.
todos: []
---

#Phase 4.4: Route Guards & Protected Routes Implementation

## Overview

This phase implements route protection by:

1. Creating a route guard utility to check authentication state
2. Marking public routes with `meta.isPublic` (routes are protected by default)
3. Implementing the route guard in `main.ts` to redirect unauthenticated users
4. Initializing auth state from storage on app startup
5. Handling redirect after successful login

## Current State

- Auth store has `isAuthenticated` state and `initializeAuth()` method
- Router guard structure exists in `main.ts` but is non-functional (always allows navigation)
- Routes exist: `/` (home), `/login`, `/notes`
- Bootstrap returns `initializeAuth` method but it's not being called
- LoginPage doesn't handle redirect query params

## Implementation Steps

### Step 1: Create Route Guard Utility

**File:** `applications/frontend-app/src/domains/auth/utils/routeGuards.ts`Create a utility function that returns a Vue Router navigation guard. This function will:

- Accept a function to get the auth store (lazy access to avoid Pinia initialization issues)
- Accept the login route name (default: 'login')
- Check if the target route is public via `meta.isPublic` (default: false, meaning protected)
- Check if user is authenticated via store
- Redirect to login with redirect query param if route is not public and user is not authenticated
- Allow navigation if route is public OR user is authenticated

**Key considerations:**

- Must work with Vue Router's `beforeEach` signature
- Store access must be lazy (called at navigation time, not guard creation time)
- Should initialize auth state from storage if not already initialized

### Step 2: Mark Routes as Protected

**Files to update:**

- `applications/frontend-app/src/app/router/index.ts` - Add `meta: { requiresAuth: true }` to home route
- `applications/frontend-app/src/domains/notes/routes.ts` - Add `meta: { requiresAuth: true }` to notes route

Routes that should be protected:

- `/` (home) - requires authentication
- `/notes` - requires authentication

Routes that should NOT be protected:

- `/login` - public route

### Step 3: Implement Route Guard in main.ts

**File:** `applications/frontend-app/src/app/main.ts`Update the existing route guard (lines 19-32) to:

1. Import the `createAuthGuard` utility
2. Replace the commented-out guard with actual implementation
3. Pass the auth bootstrap's `useStore` function to the guard
4. Ensure the guard runs after Pinia is installed but before router is used

**Important:** The guard must access the store lazily (when navigation happens) because Pinia is installed after routes are registered.

### Step 4: Initialize Auth State on App Start

**File:** `applications/frontend-app/src/app/main.ts`After Pinia is installed, call `authBootstrap.initializeAuth()` to:

- Load tokens from storage
- Restore authentication state if valid tokens exist
- Clear expired tokens

Call this after `app.use(pinia)` but before `app.mount()`.

### Step 5: Update LoginPage to Handle Redirect

**File:** `applications/frontend-app/src/domains/auth/components/LoginPage.vue`Update the login handler to:

1. Read the `redirect` query parameter from the route
2. After successful login, navigate to the intended route (or 'home' as fallback)
3. Use `useRoute()` from vue-router to access query params

This allows users to be redirected back to the page they tried to access after logging in.

## Technical Details

### Route Guard Implementation Pattern

The guard will follow this flow:

```javascript
User navigates to protected route
  ↓
router.beforeEach() executes
  ↓
Check: Does route have meta.requiresAuth?
  ↓
YES → Check: Is user authenticated?
  ↓
NO → Redirect to /login?redirect=/intended-route
YES → Allow navigation
```



### Auth State Initialization

The `initializeAuth()` method in the store:

- Reads tokens from TokenService (which reads from localStorage)
- Validates token expiration
- Sets `isAuthenticated = true` if valid tokens exist
- Clears tokens if expired

### Route Meta Configuration

Routes will be marked like this:

```typescript
{
  path: '/notes',
  name: 'notes-list',
  component: () => import('@/domains/notes/pages/NotesPage.vue'),
  meta: { requiresAuth: true }
}
```



## Files to Create/Modify

**New files:**

- `applications/frontend-app/src/domains/auth/utils/routeGuards.ts` - Route guard utility

**Modified files:**

- `applications/frontend-app/src/app/main.ts` - Implement guard and initialize auth
- `applications/frontend-app/src/app/router/index.ts` - Add `meta.requiresAuth` to home route
- `applications/frontend-app/src/domains/notes/routes.ts` - Add `meta.requiresAuth` to notes route
- `applications/frontend-app/src/domains/auth/components/LoginPage.vue` - Handle redirect query param

## Testing Considerations

After implementation, verify:

1. Unauthenticated user accessing `/notes` → redirected to `/login?redirect=/notes`
2. Authenticated user accessing `/notes` → allowed
3. User logs in → redirected to intended route (or home)
4. App startup with valid tokens in storage → user is authenticated
5. App startup with expired tokens → tokens cleared, user not authenticated
6. User accessing `/login` while authenticated → should probably redirect to home (optional enhancement)

## Dependencies

- Phase 4.1: Token storage infrastructure (already implemented)
- Phase 4.2: Login flow (already implemented)