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
  fillLoginForm,
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
    const authStore = getAuthStore(); // Get store reference before actions

    // Then: Login form is visible
    expect(wrapper.find('[data-testid="email-input"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="password-input"]').exists()).toBe(true);
    expectLoginButtonVisible(wrapper, 'Login');

    // When: User fills in credentials and submits form
    await fillLoginForm(wrapper, 'test@example.com', 'password123');
    
    // Trigger form submit
    const form = wrapper.find('form');
    await form.trigger('submit');
    await wrapper.vm.$nextTick();
    
    // Wait for login to complete (loading becomes false)
    let attempts = 0;
    while (authStore.loading && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 10));
      attempts++;
    }

    // Wait for async operations to complete
    await wrapper.vm.$nextTick();

    // Then: Store should be updated with tokens and user data
    expectUserAuthenticated(authStore);
    expectUserMatches(authStore, 'mock-user-1', 'test@example.com', 'Test User');
    expect(authStore.accessToken).toBe('mock-access-token');
    expect(authStore.refreshToken).toBe('mock-refresh-token');
  });
});