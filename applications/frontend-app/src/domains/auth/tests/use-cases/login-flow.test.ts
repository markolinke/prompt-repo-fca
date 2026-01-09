import { describe, it, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { mockBootstrapAuth, setupMockAppDependencies } from '../testHelpers';
import {
  mountLoginPage,
  clickLoginButton,
  expectLoginButtonVisible,
  getAuthStore,
  expectUserAuthenticated,
  expectUserMatches,
} from './LoginPageTestHelpers';

mockBootstrapAuth();

describe('Login Flow', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    setupMockAppDependencies();
  });

  it('should fetch current user when login button is clicked', async () => {
    // Note: This test will be fully implemented in Phase 4.2 when login() is added to AuthService
    // For Phase 4.1, we're testing that the infrastructure is in place
    
    // Given: User navigates to login page
    const wrapper = await mountLoginPage();

    // Then: Login button is visible
    expectLoginButtonVisible(wrapper);

    // When: User clicks login button (currently just calls fetchCurrentUser)
    await clickLoginButton(wrapper);

    // Then: Store should be updated with user data
    const authStore = getAuthStore();
    expectUserAuthenticated(authStore);
    expectUserMatches(authStore, 'mock-user-1', 'test@example.com', 'Test User');
    // Note: In Phase 4.1, tokens are managed via TokenStorageService
    // fetchCurrentUser() doesn't set tokens - login() will be added in Phase 4.2
    // For now, we just verify user data is fetched correctly
  });
});