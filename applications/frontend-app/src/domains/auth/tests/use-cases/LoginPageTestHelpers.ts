import { mount, VueWrapper, flushPromises } from '@vue/test-utils';
import { expect } from 'vitest';
import LoginPage from '../../components/LoginPage.vue';
import { bootstrapAuth } from '../../bootstrap';

/**
 * Mounts LoginPage and waits for initial render.
 * Use this as the starting point for most tests.
 */
export const mountLoginPage = async (): Promise<VueWrapper> => {
  const wrapper = mount(LoginPage);
  await waitForLoginPageToLoad(wrapper);
  return wrapper;
};

/**
 * Waits for Vue to finish rendering and async operations to complete.
 * Useful after mounting or after triggering actions that cause async updates.
 */
export const waitForLoginPageToLoad = async (wrapper: VueWrapper): Promise<void> => {
  await flushPromises();
  await wrapper.vm.$nextTick();
};

/**
 * Gets the login button element.
 */
export const getLoginButton = (wrapper: VueWrapper) => {
  return wrapper.find('[data-testid="login-button"]');
};

/**
 * Clicks the login button and waits for async operations to complete.
 */
export const clickLoginButton = async (wrapper: VueWrapper): Promise<void> => {
  const button = getLoginButton(wrapper);
  expect(button.exists()).toBe(true);
  await button.trigger('click');
  await waitForLoginPageToLoad(wrapper);
};

/**
 * Asserts that the login button is visible and contains the expected text.
 */
export const expectLoginButtonVisible = (wrapper: VueWrapper, expectedText: string = 'Login with Google (Mock)'): void => {
  const button = getLoginButton(wrapper);
  expect(button.exists()).toBe(true);
  expect(button.text()).toContain(expectedText);
};

/**
 * Asserts that a specific text content is visible on the page.
 */
export const expectTextVisible = (
  wrapper: VueWrapper,
  text: string
): void => {
  expect(wrapper.text()).toContain(text);
};

/**
 * Asserts that a specific text content is not visible on the page.
 */
export const expectTextNotVisible = (
  wrapper: VueWrapper,
  text: string
): void => {
  expect(wrapper.text()).not.toContain(text);
};

/**
 * Gets the auth store instance from bootstrap.
 */
export const getAuthStore = () => {
  const bootstrap = bootstrapAuth();
  return bootstrap.useStore();
};

/**
 * Asserts that the user is authenticated in the store.
 * Note: In Phase 4.1, tokens may not be set yet (login flow in Phase 4.2).
 * This checks that user is authenticated and user data exists.
 */
export const expectUserAuthenticated = (store: ReturnType<ReturnType<typeof bootstrapAuth>['useStore']>): void => {
  expect(store.isAuthenticated).toBe(true);
  expect(store.user).not.toBeNull();
  // accessToken may be null in Phase 4.1 if login() hasn't been called yet
  // Will be set in Phase 4.2 when login flow is implemented
};

/**
 * Asserts that the user is not authenticated in the store.
 */
export const expectUserNotAuthenticated = (store: ReturnType<ReturnType<typeof bootstrapAuth>['useStore']>): void => {
  expect(store.isAuthenticated).toBe(false);
  expect(store.user).toBeNull();
  expect(store.accessToken).toBeNull();
};

/**
 * Asserts that the user in the store matches the expected user data.
 */
export const expectUserMatches = (
  store: ReturnType<ReturnType<typeof bootstrapAuth>['useStore']>,
  expectedUserId: string,
  expectedUserEmail?: string,
  expectedUserName?: string
): void => {
  expect(store.user).not.toBeNull();
  expect(store.user?.id).toBe(expectedUserId);
  if (expectedUserEmail) {
    expect(store.user?.email).toBe(expectedUserEmail);
  }
  if (expectedUserName) {
    expect(store.user?.name).toBe(expectedUserName);
  }
};

