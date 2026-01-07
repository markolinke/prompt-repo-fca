import { mount, VueWrapper, flushPromises } from '@vue/test-utils';
import { expect } from 'vitest';
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

// ============================================================================
// Modal and Form Helpers
// ============================================================================

/**
 * Gets the NoteDetails component from the modal.
 * Throws if modal is not open or component is not found.
 */
export const getNoteDetailsComponent = (wrapper: VueWrapper) => {
  const modal = wrapper.find('[data-testid="note-details-modal"]');
  expect(modal.exists()).toBe(true);
  return wrapper.findComponent('[data-testid="note-details-component"]');
};

/**
 * Asserts that the modal is open.
 */
export const expectModalOpen = (wrapper: VueWrapper): void => {
  const modal = wrapper.find('[data-testid="note-details-modal"]');
  expect(modal.exists()).toBe(true);
};

/**
 * Asserts that the modal is closed.
 */
export const expectModalClosed = (wrapper: VueWrapper): void => {
  const modal = wrapper.find('[data-testid="note-details-modal"]');
  expect(modal.exists()).toBe(false);
};

/**
 * Clicks the "Add Note" button to open the create note modal.
 */
export const clickAddNoteButton = async (wrapper: VueWrapper): Promise<void> => {
  const addButton = wrapper.find('[data-testid="add-note-button"]');
  expect(addButton.exists()).toBe(true);
  await addButton.trigger('click');
  await wrapper.vm.$nextTick();
};

/**
 * Clicks the Cancel button to close the modal.
 */
export const clickCancelButton = async (wrapper: VueWrapper): Promise<void> => {
  const noteDetails = getNoteDetailsComponent(wrapper);
  const cancelButton = noteDetails.find('[data-testid="cancel-note-button"]');
  expect(cancelButton.exists()).toBe(true);
  await cancelButton.trigger('click');
  await wrapper.vm.$nextTick();
};

/**
 * Clicks on a note item to open it in the modal.
 */
export const clickNoteItem = async (
  wrapper: VueWrapper,
  index: number = 0
): Promise<void> => {
  const noteItems = getNoteItems(wrapper);
  expect(noteItems.length).toBeGreaterThan(index);
  await noteItems[index].trigger('click');
  await wrapper.vm.$nextTick();
};

/**
 * Fills in the note title field in the form.
 */
export const fillNoteTitle = async (
  wrapper: VueWrapper,
  title: string
): Promise<void> => {
  const noteDetails = getNoteDetailsComponent(wrapper);
  const titleInput = noteDetails.find('[data-testid="edit-title-input"]');
  await titleInput.setValue(title);
};

/**
 * Fills in the note content field in the form.
 */
export const fillNoteContent = async (
  wrapper: VueWrapper,
  content: string
): Promise<void> => {
  const noteDetails = getNoteDetailsComponent(wrapper);
  const contentInput = noteDetails.find('[data-testid="edit-content-input"]');
  await contentInput.setValue(content);
};

/**
 * Fills in the note category field in the form.
 */
export const fillNoteCategory = async (
  wrapper: VueWrapper,
  category: string
): Promise<void> => {
  const noteDetails = getNoteDetailsComponent(wrapper);
  const categoryInput = noteDetails.find('[data-testid="edit-category-input"]');
  await categoryInput.setValue(category);
};

/**
 * Adds a tag to the note in the form.
 */
export const addNoteTag = async (
  wrapper: VueWrapper,
  tag: string
): Promise<void> => {
  const noteDetails = getNoteDetailsComponent(wrapper);
  const tagInput = noteDetails.find('[data-testid="edit-tags-input"]');
  const addTagButton = noteDetails.find('[data-testid="add-tag-button"]');
  await tagInput.setValue(tag);
  await addTagButton.trigger('click');
  await wrapper.vm.$nextTick();
};

/**
 * Fills in all note form fields.
 */
export const fillNoteForm = async (
  wrapper: VueWrapper,
  data: {
    title: string;
    content: string;
    category?: string;
    tags?: string[];
  }
): Promise<void> => {
  await fillNoteTitle(wrapper, data.title);
  await fillNoteContent(wrapper, data.content);
  if (data.category) {
    await fillNoteCategory(wrapper, data.category);
  }
  if (data.tags) {
    for (const tag of data.tags) {
      await addNoteTag(wrapper, tag);
    }
  }
};

/**
 * Clicks the save button in the note form.
 */
export const clickSaveButton = async (wrapper: VueWrapper): Promise<void> => {
  const noteDetails = getNoteDetailsComponent(wrapper);
  const saveButton = noteDetails.find('[data-testid="save-note-button"]');
  expect(saveButton.exists()).toBe(true);
  await saveButton.trigger('click');
  await waitForNotesToLoad(wrapper);
};

/**
 * Clicks the delete button in the note form.
 */
export const clickDeleteButton = async (wrapper: VueWrapper): Promise<void> => {
  const deleteButton = wrapper.find('[data-testid="delete-note-button"]');
  expect(deleteButton.exists()).toBe(true);
  await deleteButton.trigger('click');
  await waitForNotesToLoad(wrapper);
};

/**
 * Gets the value of a form field by its test id.
 */
export const getFormFieldValue = (
  wrapper: VueWrapper,
  fieldTestId: string
): string => {
  const noteDetails = getNoteDetailsComponent(wrapper);
  const field = noteDetails.find(`[data-testid="${fieldTestId}"]`);
  const element = field.element as HTMLInputElement | HTMLTextAreaElement;
  return element.value;
};

/**
 * Asserts that a form field has the expected value.
 */
export const expectFormFieldValue = (
  wrapper: VueWrapper,
  fieldTestId: string,
  expectedValue: string
): void => {
  const value = getFormFieldValue(wrapper, fieldTestId);
  expect(value).toBe(expectedValue);
};

/**
 * Asserts that all notes from mock data are visible on the page.
 */
export const expectAllNotesVisible = (
  wrapper: VueWrapper,
  notes: Array<{ title: string; content: string; category?: string | null; tags?: string[] }>
): void => {
  notes.forEach((note) => {
    expectTextVisible(wrapper, note.title);
    expectTextVisible(wrapper, note.content);
    if (note.category) {
      expectTextVisible(wrapper, note.category);
    }
    if (note.tags && note.tags.length > 0) {
      note.tags.forEach((tag) => {
        expectTextVisible(wrapper, tag);
      });
    }
  });
};

