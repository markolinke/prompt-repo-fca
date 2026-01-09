# Phase 4.4: Route Guards & Protected Routes - Manual Testing Guide

This guide provides step-by-step instructions for manually testing the route protection and authentication flow implemented in Phase 4.4.

## Prerequisites

1. **Backend service running**: Ensure the notes-service backend is running and accessible
2. **Frontend app running**: Start the frontend development server (`pnpm dev`)
3. **Valid test credentials**: Have test user credentials ready (or create a test user via backend)

## Test Scenarios

### Test 1: Unauthenticated User Accessing Protected Route

**Objective**: Verify that unauthenticated users are redirected to login when accessing protected routes.

**Steps**:

1. **Clear browser storage**:
   - Open browser DevTools (F12)
   - Go to Application/Storage tab
   - Clear Local Storage (remove all auth tokens)

2. **Navigate to protected route**:
   - Open browser to `http://localhost:5173/notes` (or your dev server URL)
   - Or navigate to `http://localhost:5173/` (home route)

3. **Verify redirect**:
   - ✅ Should be automatically redirected to `/login`
   - ✅ URL should include redirect query parameter: `/login?redirect=/notes` or `/login?redirect=/`
   - ✅ Login page should be displayed

**Expected Result**: Unauthenticated user is redirected to login with the intended destination preserved in the query parameter.

---

### Test 2: Public Route Access

**Objective**: Verify that public routes (like login) are accessible without authentication.

**Steps**:

1. **Clear browser storage** (same as Test 1)

2. **Navigate to login page directly**:
   - Open browser to `http://localhost:5173/login`

3. **Verify access**:
   - ✅ Login page should load immediately
   - ✅ No redirect should occur
   - ✅ Login form should be visible

**Expected Result**: Login page is accessible without authentication.

---

### Test 3: Login and Redirect Flow

**Objective**: Verify that users are redirected to their intended destination after successful login.

**Steps**:

1. **Start unauthenticated**:
   - Clear browser storage (as in Test 1)
   - Navigate to `http://localhost:5173/notes`
   - Should be redirected to `/login?redirect=/notes`

2. **Perform login**:
   - Enter valid email and password in login form
   - Click "Login" button

3. **Verify redirect**:
   - ✅ After successful login, should be redirected to `/notes` (the originally intended route)
   - ✅ Notes page should load
   - ✅ User should be authenticated (check DevTools → Application → Local Storage for tokens)

**Expected Result**: After login, user is redirected to the route they originally tried to access.

---

### Test 4: Login Without Redirect Query Parameter

**Objective**: Verify default redirect behavior when login page is accessed directly (no redirect param).

**Steps**:

1. **Navigate to login directly**:
   - Clear browser storage
   - Navigate to `http://localhost:5173/login` (no query params)

2. **Perform login**:
   - Enter valid email and password
   - Click "Login" button

3. **Verify redirect**:
   - ✅ After successful login, should be redirected to home page (`/`)
   - ✅ Home page should load

**Expected Result**: When login page is accessed directly, user is redirected to home after login.

---

### Test 5: Authenticated User Accessing Protected Routes

**Objective**: Verify that authenticated users can access protected routes.

**Steps**:

1. **Authenticate user**:
   - Complete Test 3 or Test 4 to log in
   - Verify tokens exist in Local Storage

2. **Navigate to protected routes**:
   - Navigate to `http://localhost:5173/notes`
   - Navigate to `http://localhost:5173/` (home)

3. **Verify access**:
   - ✅ Both routes should load without redirect
   - ✅ Protected content should be visible
   - ✅ No redirect to login should occur

**Expected Result**: Authenticated users can access all protected routes.

---

### Test 6: Auth State Restoration on Page Refresh

**Objective**: Verify that authentication state is restored from storage when the app loads.

**Steps**:

1. **Authenticate user**:
   - Log in successfully
   - Verify tokens in Local Storage

2. **Refresh the page**:
   - While on any protected route (e.g., `/notes`), refresh the browser (F5 or Cmd+R)

3. **Verify state restoration**:
   - ✅ Page should reload and user should remain authenticated
   - ✅ Should NOT be redirected to login
   - ✅ Protected content should still be visible
   - ✅ Tokens should still exist in Local Storage

**Expected Result**: Authentication state persists across page refreshes.

---

### Test 7: Expired Token Handling

**Objective**: Verify that expired tokens are cleared and user is logged out.

**Steps**:

1. **Authenticate user**:
   - Log in successfully
   - Note tokens in Local Storage

2. **Manually expire token**:
   - Open DevTools → Application → Local Storage
   - Edit `auth_access_token` value to an expired token (or modify expiration time)
   - OR wait for token to naturally expire (if short-lived test tokens)

3. **Navigate to protected route**:
   - Refresh the page or navigate to `/notes`

4. **Verify token cleanup**:
   - ✅ Expired tokens should be cleared from Local Storage
   - ✅ User should be redirected to login
   - ✅ `isAuthenticated` should be false

**Expected Result**: Expired tokens are detected and cleared, user is logged out.

---

### Test 8: Login Page While Authenticated

**Objective**: Verify behavior when an authenticated user accesses the login page.

**Steps**:

1. **Authenticate user**:
   - Log in successfully

2. **Navigate to login page**:
   - Manually navigate to `http://localhost:5173/login`

3. **Verify access**:
   - ✅ Login page should be accessible (public route)
   - ✅ User remains authenticated
   - ✅ Can still navigate to protected routes

**Expected Result**: Login page is accessible even when authenticated (optional: could redirect to home - not implemented in Phase 4.4).

---

## Browser DevTools Checks

During testing, use DevTools to verify:

### Application → Local Storage

Check for these keys:
- `auth_access_token`: Should exist after login, empty/null after logout
- `auth_refresh_token`: Should exist after login, empty/null after logout

### Network Tab

Watch for:
- Authentication requests to `/auth/login`
- Protected route requests include `Authorization: Bearer <token>` header
- 401 responses should trigger token refresh (Phase 4.3)

### Console

Check for:
- No authentication-related errors
- Redirect messages (if logged)
- Network errors (should be handled gracefully)

---

## Edge Cases to Test

### Multiple Redirects

1. Navigate to `/notes` while unauthenticated
2. Should redirect to `/login?redirect=/notes`
3. Login successfully
4. Should redirect to `/notes`
5. ✅ Verify final destination is reached

### Direct URL Navigation

1. Type `/notes` directly in address bar while unauthenticated
2. ✅ Should redirect to login with correct redirect param

### Browser Back Button

1. Authenticate and navigate to `/notes`
2. Click browser back button
3. ✅ Should navigate back in history (not trigger auth check unnecessarily)

### Multiple Tabs

1. Log in successfully in Tab 1
2. Open new tab and navigate to `/notes`
3. ✅ Should be authenticated (tokens shared via localStorage)

---

## Troubleshooting

### User Not Redirected After Login

- **Check**: Is the login successful? (verify tokens in Local Storage)
- **Check**: Is the redirect query parameter present in URL before login?
- **Check**: Browser console for JavaScript errors

### Infinite Redirect Loop

- **Check**: Login route is marked as `meta: { isPublic: true }`
- **Check**: Auth store `isAuthenticated` state is updating correctly
- **Check**: Token storage is working (Local Storage has tokens)

### Auth State Not Restored on Refresh

- **Check**: Tokens exist in Local Storage after refresh
- **Check**: Tokens are not expired (check token expiration in DevTools)
- **Check**: `initializeAuth()` is being called on app start

### Cannot Access Protected Routes After Login

- **Check**: Tokens are stored correctly (Local Storage)
- **Check**: Auth store `isAuthenticated` is `true`
- **Check**: Token is valid (not expired, correct format)
- **Check**: Network requests include `Authorization` header

---

## Success Criteria

All tests pass when:

✅ Unauthenticated users are redirected to login  
✅ Public routes (login) are accessible without auth  
✅ Authenticated users can access protected routes  
✅ Redirect query parameter preserves intended destination  
✅ Auth state is restored on page refresh  
✅ Expired tokens are cleared  
✅ Login redirects to intended route after successful authentication  

---

## Test Data

Use these test credentials (if available from backend mock):

- **Email**: `test@example.com`
- **Password**: `password123`

Or create test user via backend API if needed.

---

## Notes

- Route protection uses **security by default**: all routes are protected unless explicitly marked with `meta: { isPublic: true }`
- Only the `/login` route is currently marked as public
- Auth state initialization happens automatically on first navigation
- Tokens are stored in Local Storage (not Session Storage)
- Redirect query parameter format: `/login?redirect=<full-path>`

