import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { mockBootstrapNotes } from '../testHelpers';

mockBootstrapNotes(); // Must be called before importing components

import NotesPage from '../../pages/NotesPage.vue';
import { mockData } from '../NotesMockData';

describe('Browsing Notes', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('When browsing the notes section without applying any filters or search', () => {
    it('should display all notes in the list', async () => {
      // Given: User navigates to notes page
      const wrapper = mount(NotesPage);

      // Wait for initial data load (async operations)
      await new Promise(resolve => setTimeout(resolve, 100));
      await wrapper.vm.$nextTick();

      // Then: All notes are displayed
      // Verify notes list is rendered (not loading/error/empty state)
      expect(wrapper.text()).not.toContain('Loading notes...');
      expect(wrapper.text()).not.toContain('Error:');
      expect(wrapper.text()).not.toContain('No notes found.');

      // Verify all notes from mock data are visible in the rendered output
      const allNotes = mockData.notes;
      allNotes.forEach(note => {
        expect(wrapper.text()).toContain(note.title);
        expect(wrapper.text()).toContain(note.instructions);
        
        // Verify category is displayed if present
        if (note.category) {
          expect(wrapper.text()).toContain(note.category);
        }

        // Verify tags are displayed if present
        if (note.tags && note.tags.length > 0) {
          note.tags.forEach(tag => {
            expect(wrapper.text()).toContain(tag);
          });
        }
      });

      // Verify the number of displayed notes matches repository data
      // Find note items by their container class (user-visible styling)
      const noteItems = wrapper.findAll('[data-testid="note-item"]');
      expect(noteItems.length).toBe(allNotes.length);
    });
  });
});

