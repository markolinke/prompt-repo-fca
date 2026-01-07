import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { mockBootstrapNotes, mockTimeout } from '../testHelpers';
import { mockData } from '../NotesMockData';
import {
  mountNotesPage,
  enterSearchTerm,
  clearSearch,
  setSearchTermWithoutWaiting,
  advanceDebounce,
  expectNotesCount,
  expectNotesVisible,
  expectNotesNotVisible,
  expectEmptyState,
  expectNotEmptyState,
  expectTextVisible,
  getNoteItems,
} from './NotesPageTestHelpers';

mockBootstrapNotes();

describe('Filtering Notes', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockTimeout.reset();
  });

  describe('When entering a filter/search term', () => {
    it('should display only notes whose title or category contains the term', async () => {
      // Given: User is on notes list page with all notes loaded
      const wrapper = await mountNotesPage();
      expectNotesCount(wrapper, mockData.notes.length);
      expectNotEmptyState(wrapper);

      // When: User enters a search term that matches title
      await enterSearchTerm(wrapper, 'Design');

      // Then: Only matching notes are displayed
      // "Design" should match notes 1 and 2 (both have "Design" in title)
      expectNotesCount(wrapper, 2);
      expectNotesVisible(wrapper, [
        'Design a new feature',
        'Design a new user interface',
      ]);
      expectNotesNotVisible(wrapper, [
        'Note without category',
        'Note without tags',
      ]);
    });

    it('should filter by category when search term matches category', async () => {
      // Given: User is on notes list page
      const wrapper = await mountNotesPage();

      // When: User enters a search term that matches category
      await enterSearchTerm(wrapper, 'coding');

      // Then: Only note with matching category is displayed
      expectNotesCount(wrapper, 1);
      expectTextVisible(wrapper, 'Note without tags');
      expectTextVisible(wrapper, 'coding/review');
      expectNotesNotVisible(wrapper, [
        'Design a new feature',
        'Design a new user interface',
        'Note without category',
      ]);
    });

    it('should show empty state when search term matches nothing', async () => {
      // Given: User is on notes list page
      const wrapper = await mountNotesPage();

      // When: User enters a search term that doesn't match any note
      await enterSearchTerm(wrapper, 'nonexistent-search-term');

      // Then: Empty state is shown
      expectEmptyState(wrapper);
    });

    it('should wait 500ms before applying the filter', async () => {
      // Given: User is on notes list page
      const wrapper = await mountNotesPage();
      const initialCount = getNoteItems(wrapper).length;
      expectNotesCount(wrapper, mockData.notes.length);

      // When: User types a search term
      await setSearchTermWithoutWaiting(wrapper, 'design');

      // Then: Results should NOT change immediately (before 500ms)
      await advanceDebounce(wrapper, 499);
      expectNotesCount(wrapper, initialCount);

      // When: Advance time to complete debounce delay (500ms total)
      await advanceDebounce(wrapper, 1);

      // Then: Results should change after delay
      expectNotesCount(wrapper, 2);
    });

    it('should show all notes when search is cleared', async () => {
      // Given: User is on notes list page with a search applied
      const wrapper = await mountNotesPage();
      await enterSearchTerm(wrapper, 'Design');
      expectNotesCount(wrapper, 2);

      // When: User clears the search
      await clearSearch(wrapper);

      // Then: All notes are displayed again
      expectNotesCount(wrapper, mockData.notes.length);
      expectNotEmptyState(wrapper);
      expectNotesVisible(wrapper, mockData.notes.map((note) => note.title));
    });

    it('should match notes by either title or category', async () => {
      // Given: User is on notes list page
      const wrapper = await mountNotesPage();

      // When: User enters a search term that could match either title or category
      // "design" matches category in notes 1 and 2, but not titles (which have "Design" with capital D)
      await enterSearchTerm(wrapper, 'design');

      // Then: Notes matching either title or category are displayed
      // Note: This test depends on case sensitivity of the search implementation
      // If case-sensitive, "design" will match categories "design/features" and "design/ui"
      const filteredItems = getNoteItems(wrapper);
      expect(filteredItems.length).toBeGreaterThan(0);
      expectTextVisible(wrapper, 'design/features');
      expectTextVisible(wrapper, 'design/ui');
    });
  });
});

