import { describe, it, expect, beforeEach } from 'vitest';
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
    // Given: User navigates to login page
    const wrapper = await mountLoginPage();

    // Then: Login button is visible
    expectLoginButtonVisible(wrapper);

    // When: User clicks login button
    await clickLoginButton(wrapper);

    // Then: Store should be updated with user data
    const authStore = getAuthStore();
    expectUserAuthenticated(authStore);
    expectUserMatches(authStore, 'mock-user-1', 'test@example.com', 'Test User');
    expect(authStore.token).toBe('mock-token');
  });
});