import { describe, it, beforeEach, expect, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { mockBootstrapAuth, setupMockAppDependencies } from '../testHelpers';
import {
  getAuthStore,
  expectUserAuthenticated,
  expectUserNotAuthenticated,
  expectUserTokens,
} from './LoginPageTestHelpers';
import {
  mountApp,
  expectLogoutButtonVisible,
  expectLogoutButtonNotVisible,
  clickLogoutButton,
  openMenu,
  expectMenuOpen,
  expectMenuClosed,
  expectUserInfoVisible,
  waitForAppToLoad,
} from './AppTestHelpers';
import { appDependencies } from '@/common/env/AppDependencies';

mockBootstrapAuth();

describe('Logout Flow', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    setupMockAppDependencies();
  });

  describe('Logout button visibility', () => {
    it('should show logout button when user is authenticated', async () => {
      // Given: User is logged in
      const authStore = getAuthStore();
      await authStore.login('test@example.com', 'password123');
      expectUserAuthenticated(authStore);

      // When: App is mounted
      const wrapper = await mountApp();
      await openMenu(wrapper);

      // Then: Logout button should be visible
      expectLogoutButtonVisible(wrapper);
    });

    it('should not show logout button when user is not authenticated', async () => {
      // Given: User is not logged in
      const authStore = getAuthStore();
      expectUserNotAuthenticated(authStore);

      // When: App is mounted
      const wrapper = await mountApp();
      await openMenu(wrapper);

      // Then: Logout button should not be visible
      expectLogoutButtonNotVisible(wrapper);
    });

    it('should show user info when authenticated', async () => {
      // Given: User is logged in
      const authStore = getAuthStore();
      await authStore.login('test@example.com', 'password123');
      expectUserAuthenticated(authStore);

      // When: App is mounted and menu is opened
      const wrapper = await mountApp();
      await openMenu(wrapper);

      // Then: User info should be visible
      expectUserInfoVisible(wrapper, 'Test User', 'test@example.com');
    });
  });

  describe('Logout action', () => {
    it('should logout successfully and clear all auth state', async () => {
      // Given: User is logged in
      const authStore = getAuthStore();
      await authStore.login('test@example.com', 'password123');
      expectUserAuthenticated(authStore);
      expectUserTokens(authStore, 'mock-access-token', 'mock-refresh-token');

      const wrapper = await mountApp();
      await openMenu(wrapper);
      expectLogoutButtonVisible(wrapper);

      // When: User clicks logout button
      await clickLogoutButton(wrapper);

      // Then: Auth state should be cleared
      expectUserNotAuthenticated(authStore);
      expect(authStore.accessToken).toBeNull();
      expect(authStore.refreshToken).toBeNull();
      expect(authStore.user).toBeNull();
    });

    it('should close menu after logout', async () => {
      // Given: User is logged in and menu is open
      const authStore = getAuthStore();
      await authStore.login('test@example.com', 'password123');
      
      const wrapper = await mountApp();
      await openMenu(wrapper);
      expectMenuOpen(wrapper);

      // When: User clicks logout
      await clickLogoutButton(wrapper);
      await waitForAppToLoad(wrapper);

      // Then: Menu should be closed
      expectMenuClosed(wrapper);
    });

    it('should redirect to login page after logout', async () => {
      // Given: User is logged in
      const authStore = getAuthStore();
      await authStore.login('test@example.com', 'password123');
      
      const wrapper = await mountApp();
      await openMenu(wrapper);

      const myRouter = appDependencies.getMyRouter();
      const navigateToSpy = vi.spyOn(myRouter, 'navigateTo');

      // When: User clicks logout
      await clickLogoutButton(wrapper);

      // Then: Should navigate to login page
      expect(navigateToSpy).toHaveBeenCalledWith({ name: 'login' });
    });
  });

  describe('Route protection after logout', () => {
    it('should not be able to access protected routes after logout', async () => {
      // Given: User is logged in
      const authStore = getAuthStore();
      await authStore.login('test@example.com', 'password123');
      expectUserAuthenticated(authStore);

      const wrapper = await mountApp();
      await openMenu(wrapper);

      // When: User logs out
      await clickLogoutButton(wrapper);
      expectUserNotAuthenticated(authStore);

      // Then: User should not be authenticated anymore
      // (Route protection will be tested in route-protection.test.ts)
      expect(authStore.isAuthenticated).toBe(false);
    });
  });
});

