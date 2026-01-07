import { mount, VueWrapper, flushPromises } from '@vue/test-utils';
import NotesPage from '../../pages/NotesPage.vue';
import { mockTimeout } from '../testHelpers';

/**
 * Mounts NotesPage and waits for initial data load.
 * Use this as the starting point for most tests.
 */
export const mountNotesPage = async (): Promise<VueWrapper> => {
  const wrapper = mount(NotesPage);
  await waitForNotesToLoad(wrapper);
  return wrapper;
};

/**
 * Waits for Vue to finish rendering and async operations to complete.
 * Useful after mounting or after triggering actions that cause async updates.
 */
export const waitForNotesToLoad = async (wrapper: VueWrapper): Promise<void> => {
  await flushPromises();
  await wrapper.vm.$nextTick();
};

/**
 * Enters a search term and waits for the debounce to complete.
 * This simulates user typing in the search input.
 */
export const enterSearchTerm = async (
  wrapper: VueWrapper,
  term: string
): Promise<void> => {
  const searchInput = wrapper.find('[data-testid="search-input"]');
  await searchInput.setValue(term);
  await waitForDebounce(wrapper);
};

/**
 * Clears the search input by entering an empty string.
 */
export const clearSearch = async (wrapper: VueWrapper): Promise<void> => {
  await enterSearchTerm(wrapper, '');
};

/**
 * Sets a search term without waiting for debounce.
 * Use this when testing debounce timing behavior.
 */
export const setSearchTermWithoutWaiting = async (
  wrapper: VueWrapper,
  term: string
): Promise<void> => {
  const searchInput = wrapper.find('[data-testid="search-input"]');
  await searchInput.setValue(term);
};

/**
 * Waits for the debounce timeout to complete (500ms).
 * Advances mock time, flushes promises, and waits for Vue updates.
 */
export const waitForDebounce = async (wrapper: VueWrapper): Promise<void> => {
  mockTimeout.runAll();
  await flushPromises();
  await wrapper.vm.$nextTick();
};

/**
 * Advances the mock timer by the specified milliseconds without completing the debounce.
 * Use this to test debounce timing behavior (e.g., verifying filter doesn't apply before 500ms).
 */
export const advanceDebounce = async (
  wrapper: VueWrapper,
  ms: number
): Promise<void> => {
  mockTimeout.advanceBy(ms);
  await flushPromises();
  await wrapper.vm.$nextTick();
};

/**
 * Gets all note items from the page.
 */
export const getNoteItems = (wrapper: VueWrapper) => {
  return wrapper.findAll('[data-testid="note-item"]');
};

/**
 * Gets the search input element.
 */
export const getSearchInput = (wrapper: VueWrapper) => {
  return wrapper.find('[data-testid="search-input"]');
};

/**
 * Asserts that exactly the expected number of notes are displayed.
 */
export const expectNotesCount = (
  wrapper: VueWrapper,
  expectedCount: number
): void => {
  const items = getNoteItems(wrapper);
  expect(items.length).toBe(expectedCount);
};

/**
 * Asserts that all specified note titles are visible in the page text.
 */
export const expectNotesVisible = (
  wrapper: VueWrapper,
  titles: string[]
): void => {
  titles.forEach(title => {
    expect(wrapper.text()).toContain(title);
  });
};

/**
 * Asserts that none of the specified note titles are visible in the page text.
 */
export const expectNotesNotVisible = (
  wrapper: VueWrapper,
  titles: string[]
): void => {
  titles.forEach(title => {
    expect(wrapper.text()).not.toContain(title);
  });
};

/**
 * Asserts that the empty state is shown (no notes found message and zero note items).
 */
export const expectEmptyState = (wrapper: VueWrapper): void => {
  expect(wrapper.text()).toContain('No notes found.');
  expectNotesCount(wrapper, 0);
};

/**
 * Asserts that the page does not show the empty state.
 */
export const expectNotEmptyState = (wrapper: VueWrapper): void => {
  expect(wrapper.text()).not.toContain('No notes found.');
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

