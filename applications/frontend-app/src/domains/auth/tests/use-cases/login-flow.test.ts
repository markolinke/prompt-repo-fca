import { describe, it, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { mockBootstrapAuth, setupMockAppDependencies } from '../testHelpers';
import {
  mountLoginPage,
  getAuthStore,
  expectUserAuthenticated,
  expectUserMatches,
  expectUserTokens,
  expectLoginFormVisible,
  fillLoginForm,
  submitLoginForm,
  waitForLoginToComplete,
} from './LoginPageTestHelpers';

mockBootstrapAuth();

describe('Login Flow', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    setupMockAppDependencies();
  });

  it('should login successfully with email and password', async () => {
    // Given: User navigates to login page
    const wrapper = await mountLoginPage();
    const authStore = getAuthStore();

    // Then: Login form is visible
    expectLoginFormVisible(wrapper);

    // When: User fills in credentials and submits form
    await fillLoginForm(wrapper, 'test@example.com', 'password123');
    await submitLoginForm(wrapper);
    await waitForLoginToComplete(authStore);

    // Then: Store should be updated with tokens and user data
    expectUserAuthenticated(authStore);
    expectUserMatches(authStore, 'mock-user-1', 'test@example.com', 'Test User');
    expectUserTokens(authStore, 'mock-access-token', 'mock-refresh-token');
  });
});