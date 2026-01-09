---
name: "Phase 4.5: Logout and Token Cleanup"
overview: Complete the logout functionality by implementing proper logout UI, conditional display based on auth state, and ensuring tokens are cleared with proper redirect to login page.
todos:
  - id: update-app-vue-script
    content: "Update App.vue script section: import bootstrapAuth, get authStore, create handleLogout function"
    status: completed
  - id: update-app-vue-template
    content: "Update App.vue template: make logout conditional on auth state, replace router-link with button, add click handlers"
    status: completed
    dependencies:
      - update-app-vue-script
  - id: add-user-info-display
    content: Optionally add user info display in menu when authenticated (show user name/email)
    status: completed
    dependencies:
      - update-app-vue-template
  - id: test-logout-flow
    content: "Test complete logout flow: verify token cleanup, redirect, and route protection after logout"
    status: completed
    dependencies:
      - update-app-vue-template
---

# Phase

4.5: Logout and Token Cleanup Implementation Plan

## Current State Analysis

**What exists:**

- `AuthStore.logout()` method calls `clearAuth()` which clears tokens and state
- `TokenService.clearTokens()` properly removes tokens from storage
- `App.vue` has a logout menu item, but it only navigates to login (doesn't call logout)
- Logout menu item is always visible (not conditional on auth state)

**What's missing:**

- Logout action doesn't actually call `authStore.logout()` before redirect
- Menu doesn't conditionally show/hide logout based on authentication state
- No user info display when authenticated (who is logged in?)
- Logout should redirect to login after clearing state

## Implementation Plan

### 1. Update App.vue to Implement Logout Action

**File: [applications/frontend-app/src/app/App.vue](applications/frontend-app/src/app/App.vue)****Changes needed:**

- Import `bootstrapAuth` to access auth store
- Import `appDependencies` to access router
- Replace the logout `router-link` with a button that calls logout handler
- Add logout handler function that:

1. Calls `authStore.logout()` to clear tokens and state
2. Closes the menu
3. Redirects to login page

- Make logout menu item conditionally visible only when `authStore.isAuthenticated` is true
- Optionally: Show user info (name/email) when authenticated

**Code structure:**

```vue
<script setup lang="ts">
import { bootstrapAuth } from '@/domains/auth';
import { appDependencies } from '@/common/env/AppDependencies';

const bootstrap = bootstrapAuth();
const authStore = bootstrap.useStore();
const myRouter = appDependencies.getMyRouter();

const handleLogout = () => {
  authStore.logout();
  isMenuOpen.value = false;
  myRouter.navigateTo({ name: 'login' });
};
</script>

<template>
  <!-- Conditionally show logout only when authenticated -->
  <div v-if="authStore.isAuthenticated" ...>
    <button @click="handleLogout">Logout</button>
  </div>
</template>
```



### 2. Enhance User Experience (Optional but Recommended)

**Options to consider:**

- Show user's name or email in the menu when authenticated
- Add a user profile section in the menu header
- Style logout button appropriately (red/destructive style)

**Implementation approach:**

- Access `authStore.user` to display user info
- Show user info above logout button
- Use Tailwind classes for styling (following project conventions)

### 3. Verify Token Cleanup

**Ensure completeness:**

- `logout()` clears `user`, `accessToken`, `refreshToken`
- `logout()` sets `isAuthenticated` to false
- `logout()` calls `tokenService.clearTokens()` which clears localStorage
- All auth state is reset

**Verification:**

- Check that tokens are removed from localStorage after logout
- Verify that subsequent API calls don't include Authorization header
- Ensure route guards redirect to login after logout

## Implementation Steps

1. **Update App.vue script section:**

- Import bootstrapAuth and appDependencies
- Get authStore instance via bootstrap
- Create handleLogout function
- Access myRouter for navigation

2. **Update App.vue template:**

- Wrap logout menu item with `v-if="authStore.isAuthenticated"`
- Replace `router-link` with `button` element
- Add `@click="handleLogout"` handler
- Add `@click="isMenuOpen = false"` to close menu
- Optionally add user info display above logout

3. **Test the logout flow:**

- Login as a user
- Click logout button
- Verify redirect to login page
- Verify tokens are cleared from localStorage
- Verify subsequent navigation requires re-authentication

## Files to Modify

- `applications/frontend-app/src/app/App.vue` - Main implementation

## Files Already Complete (No Changes Needed)

- `applications/frontend-app/src/domains/auth/store/AuthStore.ts` - logout() method exists
- `applications/frontend-app/src/domains/auth/services/TokenService.ts` - clearTokens() exists

## Testing Checklist

After implementation, verify:

- [ ] Logout button only appears when user is authenticated
- [ ] Clicking logout clears all auth state
- [ ] Tokens are removed from localStorage
- [ ] User is redirected to login page
- [ ] Menu closes after logout
- [ ] After logout, accessing protected routes redirects to login

### Files to Modify for Testing

**New Test Files to Create:**

- `applications/frontend-app/src/domains/auth/tests/use-cases/logout-flow.test.ts` - Integration test for complete logout flow from App.vue component
- Test logout button visibility based on auth state
- Test logout action clears tokens and state
- Test redirect to login page after logout
- Test menu closes after logout
- Test route protection after logout (cannot access protected routes)

**Optional Test Helpers (if needed):**

- `applications/frontend-app/src/domains/auth/tests/use-cases/AppTestHelpers.ts` - Test helpers for App.vue component testing
- Helper to mount App.vue component
- Helper to find logout button
- Helper to click logout button
- Helper to verify menu state (open/closed)
- Helper to verify logout button visibility

**Test Files to Potentially Update:**

- `applications/frontend-app/src/domains/auth/tests/use-cases/route-protection.test.ts` - Add logout-related test cases
- Test that after logout, user cannot access protected routes
- Test that logout triggers route guard redirect