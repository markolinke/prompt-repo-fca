import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { mockBootstrapNotes, mockCurrentTime } from '../testHelpers';
import { mockData } from '../NotesMockData';
import { bootstrapNotes } from '../../bootstrap';
import {
  mountNotesPage,
  expectNotesCount,
  clickAddNoteButton,
  fillNoteForm,
  clickSaveButton,
  expectModalClosed,
  expectTextVisible,
  clickNoteItem,
  expectFormFieldValue,
  fillNoteTitle,
  fillNoteContent,
  fillNoteCategory,
  addNoteTag,
  clickDeleteButton,
  expectModalOpen,
  getNoteItems,
  clickCancelButton,
} from './NotesPageTestHelpers';

mockBootstrapNotes();

describe('Note CRUD Operations', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockCurrentTime.setDate(new Date('2024-01-15T10:00:00Z'));
  });

  describe('Creating a New Note', () => {
    it('should create a new note with correct values and date', async () => {
      const wrapper = await mountNotesPage();
      const initialNoteCount = getNoteItems(wrapper).length;
      expectNotesCount(wrapper, mockData.notes.length);

      await clickAddNoteButton(wrapper);
      expectModalOpen(wrapper);

      await fillNoteForm(wrapper, {
        title: 'New Test Note',
        content: 'This is test content',
        category: 'test/category',
      });

      await clickSaveButton(wrapper);

      expectNotesCount(wrapper, initialNoteCount + 1);
      expectTextVisible(wrapper, 'New Test Note');
      expectTextVisible(wrapper, 'This is test content');
      expectTextVisible(wrapper, 'test/category');

      const bootstrap = bootstrapNotes();
      const store = bootstrap.useStore();
      const newNote = store.notes.find((n) => n.title === 'New Test Note');
      expect(newNote).toBeDefined();
      expect(newNote!.last_modified_utc.getTime()).toBe(
        mockCurrentTime.getCurrentTime().getTime()
      );

      expectModalClosed(wrapper);
    });

    it('should not create a new note if user closes the modal without saving', async () => {
      const wrapper = await mountNotesPage();
      const initialNoteCount = getNoteItems(wrapper).length;
      expectNotesCount(wrapper, mockData.notes.length);

      await clickAddNoteButton(wrapper);
      expectModalOpen(wrapper);

      await clickCancelButton(wrapper);
      expectModalClosed(wrapper);
      expectNotesCount(wrapper, initialNoteCount);
    });
  });

  describe('Reading/Selecting a Note', () => {
    it('should open modal and display note details when clicking on a note', async () => {
      const wrapper = await mountNotesPage();
      const firstNote = mockData.notes[0];

      await clickNoteItem(wrapper, 0);
      expectModalOpen(wrapper);

      expectFormFieldValue(wrapper, 'edit-title-input', firstNote.title);
      expectFormFieldValue(wrapper, 'edit-content-input', firstNote.content);
      if (firstNote.category) {
        expectFormFieldValue(wrapper, 'edit-category-input', firstNote.category);
      }
    });
  });

  describe('Updating an Existing Note', () => {
    it('should update note values and preserve date', async () => {
      const wrapper = await mountNotesPage();
      const firstNote = mockData.notes[0];

      await clickNoteItem(wrapper, 0);

      await fillNoteTitle(wrapper, 'Updated Title');
      await fillNoteContent(wrapper, 'Updated Content');
      await fillNoteCategory(wrapper, 'updated/category');

      // set mock current time as one hour from original date
      mockCurrentTime.advanceTimeBy(3600000);
      const newTime = mockCurrentTime.getCurrentTime();

      await clickSaveButton(wrapper);

      expectTextVisible(wrapper, 'Updated Title');
      expectTextVisible(wrapper, 'Updated Content');
      expectTextVisible(wrapper, 'updated/category');
      expect(wrapper.text()).not.toContain(firstNote.title);

      const bootstrap = bootstrapNotes();
      const store = bootstrap.useStore();
      const updatedNote = store.notes.find((n) => n.id === firstNote.id);
      expect(updatedNote).toBeDefined();
      expect(updatedNote!.title).toBe('Updated Title');
      expect(updatedNote!.content).toBe('Updated Content');
      expect(updatedNote!.category).toBe('updated/category');
      expect(updatedNote!.last_modified_utc.getTime()).toBe(newTime.getTime());
    });
  });

  describe('Validating Updated Values', () => {
    it('should correctly save all updated field values', async () => {
      const wrapper = await mountNotesPage();

      await clickNoteItem(wrapper, 0);

      await fillNoteTitle(wrapper, 'Multi Field Update');
      await fillNoteContent(wrapper, 'Updated content with changes');
      await fillNoteCategory(wrapper, 'new/category');
      await addNoteTag(wrapper, 'newtag');

      await clickSaveButton(wrapper);

      const bootstrap = bootstrapNotes();
      const store = bootstrap.useStore();
      const updatedNote = store.notes.find((n) => n.title === 'Multi Field Update');

      expect(updatedNote).toBeDefined();
      expect(updatedNote!.title).toBe('Multi Field Update');
      expect(updatedNote!.content).toBe('Updated content with changes');
      expect(updatedNote!.category).toBe('new/category');
      expect(updatedNote!.tags).toContain('newtag');

      const noteCount = store.notes.filter((n) => n.title === 'Multi Field Update').length;
      expect(noteCount).toBe(1);
    });
  });

  describe('Date Modification Tracking', () => {
    it('should set current time for new notes', async () => {
      const testDate = new Date('2024-01-20T14:30:00Z');
      mockCurrentTime.setDate(testDate);

      const wrapper = await mountNotesPage();

      await clickAddNoteButton(wrapper);

      await fillNoteTitle(wrapper, 'Date Test Note');
      await fillNoteContent(wrapper, 'Testing date');

      await clickSaveButton(wrapper);

      const bootstrap = bootstrapNotes();
      const store = bootstrap.useStore();
      const newNote = store.notes.find((n) => n.title === 'Date Test Note');

      expect(newNote).toBeDefined();
      expect(newNote!.last_modified_utc.getTime()).toBe(testDate.getTime());
    });

    it('should preserve original date when updating existing note', async () => {
      const originalDate = new Date('2024-01-10T08:00:00Z');
      mockCurrentTime.setDate(originalDate);

      const wrapper = await mountNotesPage();
      const firstNote = mockData.notes[0];

      await clickNoteItem(wrapper, 0);

      mockCurrentTime.advanceTimeBy(3600000);

      await fillNoteTitle(wrapper, 'Updated After Time Advance');

      await clickSaveButton(wrapper);

      const bootstrap = bootstrapNotes();
      const store = bootstrap.useStore();
      const updatedNote = store.notes.find((n) => n.id === firstNote.id);

      expect(updatedNote).toBeDefined();
      expect(updatedNote!.last_modified_utc.getTime()).toBe(
        mockCurrentTime.getCurrentTime().getTime()
      );
    });
  });

  describe('Deleting a Note', () => {
    it('should remove note from list and repository when deleted', async () => {
      const wrapper = await mountNotesPage();
      const initialNoteCount = getNoteItems(wrapper).length;
      const firstNote = mockData.notes[0];

      await clickNoteItem(wrapper, 0);

      await clickDeleteButton(wrapper);

      expectNotesCount(wrapper, initialNoteCount - 1);
      expect(wrapper.text()).not.toContain(firstNote.title);

      const bootstrap = bootstrapNotes();
      const store = bootstrap.useStore();
      const deletedNote = store.notes.find((n) => n.id === firstNote.id);
      expect(deletedNote).toBeUndefined();

      expectModalClosed(wrapper);
    });
  });
});

