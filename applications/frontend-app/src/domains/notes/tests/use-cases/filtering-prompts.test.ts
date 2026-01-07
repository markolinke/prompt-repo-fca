import { describe, it, expect, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { mockBootstrapNotes, mockTimeout } from '../testHelpers';

mockBootstrapNotes(); // Must be called before importing components

import NotesPage from '../../pages/NotesPage.vue';
import { mockData } from '../NotesMockData';

describe('Filtering Notes', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    // Reset mock timeout to ensure test isolation
    mockTimeout.reset();
  });

  describe('When entering a filter/search term', () => {
    it('should display only notes whose title or category contains the term', async () => {
      // Given: User is on notes list page with all notes loaded
      const wrapper = mount(NotesPage);

      // Wait for initial data load (component mount)
      await flushPromises();
      await wrapper.vm.$nextTick();

      // Verify all notes are displayed initially
      const allNotes = mockData.notes;
      expect(wrapper.text()).not.toContain('No notes found.');
      const initialNoteItems = wrapper.findAll('[data-testid="note-item"]');
      expect(initialNoteItems.length).toBe(allNotes.length);

      // When: User enters a search term that matches title
      const searchInput = wrapper.find('[data-testid="search-input"]');
      await searchInput.setValue('Design');
      
      // Advance time to trigger debounce (500ms)
      mockTimeout.runAll();
      await flushPromises();
      await wrapper.vm.$nextTick();

      // Then: Only matching notes are displayed
      // "Design" should match notes 1 and 2 (both have "Design" in title)
      const filteredItems = wrapper.findAll('[data-testid="note-item"]');
      expect(filteredItems.length).toBe(2);
      expect(wrapper.text()).toContain('Design a new feature');
      expect(wrapper.text()).toContain('Design a new user interface');
      expect(wrapper.text()).not.toContain('Note without category');
      expect(wrapper.text()).not.toContain('Note without tags');
    });

    it('should filter by category when search term matches category', async () => {
      // Given: User is on notes list page
      const wrapper = mount(NotesPage);
      await wrapper.vm.$nextTick();

      // When: User enters a search term that matches category
      const searchInput = wrapper.find('[data-testid="search-input"]');
      await searchInput.setValue('coding');
      
      // Advance time to trigger debounce (500ms)
      mockTimeout.runAll();
      await flushPromises();
      await wrapper.vm.$nextTick();

      // Then: Only note with matching category is displayed
      const filteredItems = wrapper.findAll('[data-testid="note-item"]');
      expect(filteredItems.length).toBe(1);
      expect(wrapper.text()).toContain('Note without tags');
      expect(wrapper.text()).toContain('coding/review');
      expect(wrapper.text()).not.toContain('Design a new feature');
      expect(wrapper.text()).not.toContain('Design a new user interface');
      expect(wrapper.text()).not.toContain('Note without category');
    });

    it('should show empty state when search term matches nothing', async () => {
      // Given: User is on notes list page
      const wrapper = mount(NotesPage);
      await wrapper.vm.$nextTick();

      // When: User enters a search term that doesn't match any note
      const searchInput = wrapper.find('[data-testid="search-input"]');
      await searchInput.setValue('nonexistent-search-term');
      
      // Advance time to trigger debounce (500ms)
      mockTimeout.runAll();
      await flushPromises();
      await wrapper.vm.$nextTick();

      // Then: Empty state is shown
      expect(wrapper.text()).toContain('No notes found.');
      const filteredItems = wrapper.findAll('[data-testid="note-item"]');
      expect(filteredItems.length).toBe(0);
    });

    it('should wait 500ms before applying the filter', async () => {
      // Given: User is on notes list page
      const wrapper = mount(NotesPage);
      await flushPromises();
      await wrapper.vm.$nextTick();

      const allNotes = mockData.notes;
      const initialCount = wrapper.findAll('[data-testid="note-item"]').length;
      expect(initialCount).toBe(allNotes.length);

      // When: User types a search term
      const searchInput = wrapper.find('[data-testid="search-input"]');
      await searchInput.setValue('design');

      // Then: Results should NOT change immediately (before 500ms)
      mockTimeout.advanceBy(499); // Advance by less than debounce delay
      await flushPromises();
      await wrapper.vm.$nextTick();
      const beforeDelayCount = wrapper.findAll('[data-testid="note-item"]').length;
      expect(beforeDelayCount).toBe(initialCount); // Still showing all notes

      // When: Advance time to complete debounce delay (500ms total)
      mockTimeout.advanceBy(1); // Complete the remaining 1ms
      await flushPromises();
      await wrapper.vm.$nextTick();

      // Then: Results should change after delay
      const afterDelayCount = wrapper.findAll('[data-testid="note-item"]').length;
      expect(afterDelayCount).toBe(2); // Filtered to 2 notes
      expect(afterDelayCount).not.toBe(initialCount);
    });

    it('should show all notes when search is cleared', async () => {
      // Given: User is on notes list page with a search applied
      const wrapper = mount(NotesPage);
      await wrapper.vm.$nextTick();

      // Apply a search
      const searchInput = wrapper.find('[data-testid="search-input"]');
      await searchInput.setValue('Design');
      mockTimeout.runAll(); // Trigger debounce
      
      await flushPromises();
      await wrapper.vm.$nextTick();

      // Verify search is applied
      const filteredCount = wrapper.findAll('[data-testid="note-item"]').length;
      expect(filteredCount).toBe(2);

      // When: User clears the search
      await searchInput.setValue('');
      
      // Advance time to trigger debounce (500ms)
      mockTimeout.runAll();
      await flushPromises();
      await wrapper.vm.$nextTick();

      // Then: All notes are displayed again
      const allNotes = mockData.notes;
      const clearedCount = wrapper.findAll('[data-testid="note-item"]').length;
      expect(clearedCount).toBe(allNotes.length);
      expect(wrapper.text()).not.toContain('No notes found.');
      
      // Verify all notes are visible
      allNotes.forEach(note => {
        expect(wrapper.text()).toContain(note.title);
      });
    });

    it('should match notes by either title or category', async () => {
      // Given: User is on notes list page
      const wrapper = mount(NotesPage);
      await wrapper.vm.$nextTick();

      // When: User enters a search term that could match either title or category
      // "design" matches category in notes 1 and 2, but not titles (which have "Design" with capital D)
      const searchInput = wrapper.find('[data-testid="search-input"]');
      await searchInput.setValue('design');
      
      // Advance time to trigger debounce (500ms)
      mockTimeout.runAll();
      await flushPromises();
      await wrapper.vm.$nextTick();

      // Then: Notes matching either title or category are displayed
      // Note: This test depends on case sensitivity of the search implementation
      // If case-sensitive, "design" will match categories "design/features" and "design/ui"
      const filteredItems = wrapper.findAll('[data-testid="note-item"]');
      // The search should find notes where category contains "design"
      expect(filteredItems.length).toBeGreaterThan(0);
      expect(wrapper.text()).toContain('design/features');
      expect(wrapper.text()).toContain('design/ui');
    });
  });
});

