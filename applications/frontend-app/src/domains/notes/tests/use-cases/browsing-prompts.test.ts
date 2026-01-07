import { describe, it, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { mockBootstrapNotes } from '../testHelpers';
import { mockData } from '../NotesMockData';
import {
  mountNotesPage,
  expectNotesCount,
  expectNotEmptyState,
  expectAllNotesVisible,
  expectTextNotVisible,
} from './NotesPageTestHelpers';

mockBootstrapNotes();

describe('Browsing Notes', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('When browsing the notes section without applying any filters or search', () => {
    it('should display all notes in the list', async () => {
      // Given: User navigates to notes page
      const wrapper = await mountNotesPage();

      // Then: All notes are displayed
      // Verify notes list is rendered (not loading/error/empty state)
      expectTextNotVisible(wrapper, 'Loading notes...');
      expectTextNotVisible(wrapper, 'Error:');
      expectNotEmptyState(wrapper);

      // Verify all notes from mock data are visible in the rendered output
      expectAllNotesVisible(wrapper, mockData.notes);

      // Verify the number of displayed notes matches repository data
      expectNotesCount(wrapper, mockData.notes.length);
    });
  });
});

