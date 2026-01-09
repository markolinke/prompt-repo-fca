import { mount, VueWrapper, flushPromises } from '@vue/test-utils';
import { expect } from 'vitest';
import { createRouter, createWebHistory, type Router } from 'vue-router';
import { defineComponent } from 'vue';
import App from '@/app/App.vue';
import { getAuthStore } from './LoginPageTestHelpers';

// Create simple test components for router
const TestHomePage = defineComponent({
  name: 'TestHomePage',
  template: '<div>Home Page</div>',
});

const TestLoginPage = defineComponent({
  name: 'TestLoginPage',
  template: '<div>Login Page</div>',
});

const TestNotesPage = defineComponent({
  name: 'TestNotesPage',
  template: '<div>Notes Page</div>',
});

/**
 * Creates a test router with basic routes.
 */
export const createTestRouter = (): Router => {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', name: 'home', component: TestHomePage },
      { path: '/login', name: 'login', component: TestLoginPage, meta: { isPublic: true } },
      { path: '/notes', name: 'notes-list', component: TestNotesPage },
    ],
  });
};

/**
 * Mounts App component and waits for initial render.
 * Use this as the starting point for App.vue tests.
 * Optionally accepts a router instance; if not provided, creates a test router.
 */
export const mountApp = async (router?: Router): Promise<VueWrapper> => {
  const testRouter = router || createTestRouter();
  const wrapper = mount(App, {
    global: {
      plugins: [testRouter],
    },
  });
  await waitForAppToLoad(wrapper);
  return wrapper;
};

/**
 * Waits for Vue to finish rendering and async operations to complete.
 * Useful after mounting or after triggering actions that cause async updates.
 */
export const waitForAppToLoad = async (wrapper: VueWrapper): Promise<void> => {
  await flushPromises();
  await wrapper.vm.$nextTick();
};

/**
 * Gets the logout button element.
 */
export const getLogoutButton = (wrapper: VueWrapper) => {
  return wrapper.find('[data-testid="logout-button"]');
};

/**
 * Asserts that the logout button is visible.
 */
export const expectLogoutButtonVisible = (wrapper: VueWrapper): void => {
  const button = getLogoutButton(wrapper);
  expect(button.exists()).toBe(true);
};

/**
 * Asserts that the logout button is not visible.
 */
export const expectLogoutButtonNotVisible = (wrapper: VueWrapper): void => {
  const button = getLogoutButton(wrapper);
  expect(button.exists()).toBe(false);
};

/**
 * Clicks the logout button and waits for async operations to complete.
 */
export const clickLogoutButton = async (wrapper: VueWrapper): Promise<void> => {
  const button = getLogoutButton(wrapper);
  expect(button.exists()).toBe(true);
  await button.trigger('click');
  await waitForAppToLoad(wrapper);
};

/**
 * Logs out using the menu button.
 * Optionally accepts a router instance for mounting.
 */
export const logoutUsingMenuButton = async (router?: Router): Promise<void> => {
  const wrapper = await mountApp(router);
  await openMenu(wrapper);
  expectLogoutButtonVisible(wrapper);

  await clickLogoutButton(wrapper);
}

/**
 * Gets the menu toggle button.
 */
export const getMenuToggleButton = (wrapper: VueWrapper) => {
  return wrapper.find('[aria-label="Open menu"]');
};

/**
 * Opens the menu by clicking the toggle button.
 */
export const openMenu = async (wrapper: VueWrapper): Promise<void> => {
  const toggleButton = getMenuToggleButton(wrapper);
  expect(toggleButton.exists()).toBe(true);
  await toggleButton.trigger('click');
  await waitForAppToLoad(wrapper);
};

/**
 * Asserts that the menu is open (checks for menu panel visibility).
 */
export const expectMenuOpen = (wrapper: VueWrapper): void => {
  const menuPanel = wrapper.find('.fixed.inset-x-0.top-16');
  expect(menuPanel.exists()).toBe(true);
};

/**
 * Asserts that the menu is closed (menu panel should not be visible).
 */
export const expectMenuClosed = (wrapper: VueWrapper): void => {
  const menuPanel = wrapper.find('.fixed.inset-x-0.top-16');
  expect(menuPanel.exists()).toBe(false);
};

/**
 * Asserts that user info is displayed in the menu.
 */
export const expectUserInfoVisible = (
  wrapper: VueWrapper,
  expectedName?: string,
  expectedEmail?: string
): void => {
  const authStore = getAuthStore();
  expect(authStore.user).not.toBeNull();
  
  if (expectedName) {
    expect(wrapper.text()).toContain(expectedName);
  }
  if (expectedEmail) {
    expect(wrapper.text()).toContain(expectedEmail);
  }
};

