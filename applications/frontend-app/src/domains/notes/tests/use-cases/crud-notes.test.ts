import { describe, it, expect, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { mockBootstrapNotes, mockCurrentTime } from '../testHelpers';

mockBootstrapNotes();

import NotesPage from '../../pages/NotesPage.vue';
import { mockData } from '../NotesMockData';
import { bootstrapNotes } from '../../bootstrap';

describe('Note CRUD Operations', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockCurrentTime.setDate(new Date('2024-01-15T10:00:00Z'));
  });

  describe('Creating a New Note', () => {
    it('should create a new note with correct values and date', async () => {
      const wrapper = mount(NotesPage);
      
      await flushPromises();
      await wrapper.vm.$nextTick();

      const initialNoteCount = wrapper.findAll('[data-testid="note-item"]').length;
      expect(initialNoteCount).toBe(mockData.notes.length);

      const addButton = wrapper.find('[data-testid="add-note-button"]');
      expect(addButton).toBeDefined();
      await addButton!.trigger('click');
      await wrapper.vm.$nextTick();

      const modal = wrapper.find('[data-testid="note-details-modal"]');
      expect(modal.exists()).toBe(true);

      const noteDetails = wrapper.findComponent('[data-testid="note-details-component"]');
      const titleInput = noteDetails.find('[data-testid="edit-title-input"]');
      const contentInput = noteDetails.find('#edit-content');
      const categoryInput = noteDetails.find('#edit-category');

      await titleInput.setValue('New Test Note');
      await contentInput.setValue('This is test content');
      await categoryInput.setValue('test/category');

      const saveButton = noteDetails.find('[data-testid="save-note-button"]');
      expect(saveButton).toBeDefined();
      await saveButton!.trigger('click');

      await flushPromises();
      await wrapper.vm.$nextTick();

      const finalNoteCount = wrapper.findAll('[data-testid="note-item"]').length;
      expect(finalNoteCount).toBe(initialNoteCount + 1);

      expect(wrapper.text()).toContain('New Test Note');
      expect(wrapper.text()).toContain('This is test content');
      expect(wrapper.text()).toContain('test/category');

      const bootstrap = bootstrapNotes();
      const store = bootstrap.useStore();
      const newNote = store.notes.find(n => n.title === 'New Test Note');
      expect(newNote).toBeDefined();
      expect(newNote!.last_modified_utc.getTime()).toBe(mockCurrentTime.getCurrentTime().getTime());

      expect(wrapper.find('[data-testid="note-details-modal"]').exists()).toBe(false);
    });
  });

  describe('Reading/Selecting a Note', () => {
    it('should open modal and display note details when clicking on a note', async () => {
      const wrapper = mount(NotesPage);
      
      await flushPromises();
      await wrapper.vm.$nextTick();

      const noteItems = wrapper.findAll('[data-testid="note-item"]');
      expect(noteItems.length).toBeGreaterThan(0);

      const firstNote = mockData.notes[0];
      await noteItems[0].trigger('click');
      await wrapper.vm.$nextTick();

      const modal = wrapper.find('[data-testid="note-details-modal"]');
      expect(modal.exists()).toBe(true);

      const noteDetails = wrapper.find('[data-testid="note-details-component"]');
      const titleInput = noteDetails.find('[data-testid="edit-title-input"]');
      const contentInput = noteDetails.find('[data-testid="edit-content-input"]');
      const categoryInput = noteDetails.find('[data-testid="edit-category-input"]');

      expect((titleInput.element as HTMLInputElement).value).toBe(firstNote.title);
      expect((contentInput.element as HTMLTextAreaElement).value).toBe(firstNote.content);
      if (firstNote.category) {
        expect((categoryInput.element as HTMLInputElement).value).toBe(firstNote.category);
      }
    });
  });

  describe('Updating an Existing Note', () => {
    it('should update note values and preserve date', async () => {
      const wrapper = mount(NotesPage);
      
      await flushPromises();
      await wrapper.vm.$nextTick();

      const noteItems = wrapper.findAll('[data-testid="note-item"]');
      const firstNote = mockData.notes[0];

      await noteItems[0].trigger('click');
      await wrapper.vm.$nextTick();

      const noteDetails = wrapper.findComponent('[data-testid="note-details-component"]');
      const titleInput = noteDetails.find('[data-testid="edit-title-input"]');
      const contentInput = noteDetails.find('[data-testid="edit-content-input"]');
      const categoryInput = noteDetails.find('[data-testid="edit-category-input"]');

      await titleInput.setValue('Updated Title');
      await contentInput.setValue('Updated Content');
      await categoryInput.setValue('updated/category');

      // set mock current time as one hour from original date
      mockCurrentTime.advanceTimeBy(3600000);
      const newTime = mockCurrentTime.getCurrentTime();

      const saveButton = noteDetails.find('[data-testid="save-note-button"]');
      await saveButton!.trigger('click');

      await flushPromises();
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('Updated Title');
      expect(wrapper.text()).toContain('Updated Content');
      expect(wrapper.text()).toContain('updated/category');
      expect(wrapper.text()).not.toContain(firstNote.title);

      const bootstrap = bootstrapNotes();
      const store = bootstrap.useStore();
      const updatedNote = store.notes.find(n => n.id === firstNote.id);
      expect(updatedNote).toBeDefined();
      expect(updatedNote!.title).toBe('Updated Title');
      expect(updatedNote!.content).toBe('Updated Content');
      expect(updatedNote!.category).toBe('updated/category');
      expect(updatedNote!.last_modified_utc.getTime()).toBe(newTime.getTime());
    });
  });

  describe('Validating Updated Values', () => {
    it('should correctly save all updated field values', async () => {
      const wrapper = mount(NotesPage);
      
      await flushPromises();
      await wrapper.vm.$nextTick();

      const noteItems = wrapper.findAll('[data-testid="note-item"]');
      await noteItems[0].trigger('click');
      await wrapper.vm.$nextTick();

      const noteDetails = wrapper.findComponent('[data-testid="note-details-component"]');
      const titleInput = noteDetails.find('[data-testid="edit-title-input"]');
      const contentInput = noteDetails.find('[data-testid="edit-content-input"]');
      const categoryInput = noteDetails.find('[data-testid="edit-category-input"]');
      const tagInput = noteDetails.find('[data-testid="edit-tags-input"]');
      const addTagButton = noteDetails.find('[data-testid="add-tag-button"]');

      await titleInput.setValue('Multi Field Update');
      await contentInput.setValue('Updated content with changes');
      await categoryInput.setValue('new/category');
      await tagInput.setValue('newtag');
      await addTagButton!.trigger('click');
      await wrapper.vm.$nextTick();

      const saveButton = noteDetails.find('[data-testid="save-note-button"]');
      await saveButton!.trigger('click');

      await flushPromises();
      await wrapper.vm.$nextTick();

      const bootstrap = bootstrapNotes();
      const store = bootstrap.useStore();
      const updatedNote = store.notes.find(n => n.title === 'Multi Field Update');
      
      expect(updatedNote).toBeDefined();
      expect(updatedNote!.title).toBe('Multi Field Update');
      expect(updatedNote!.content).toBe('Updated content with changes');
      expect(updatedNote!.category).toBe('new/category');
      expect(updatedNote!.tags).toContain('newtag');

      const noteCount = store.notes.filter(n => n.title === 'Multi Field Update').length;
      expect(noteCount).toBe(1);
    });
  });

  describe('Date Modification Tracking', () => {
    it('should set current time for new notes', async () => {
      const testDate = new Date('2024-01-20T14:30:00Z');
      mockCurrentTime.setDate(testDate);

      const wrapper = mount(NotesPage);
      
      await flushPromises();
      await wrapper.vm.$nextTick();

      const addButton = wrapper.find('[data-testid="add-note-button"]');
      await addButton.trigger('click');
      await wrapper.vm.$nextTick();

      const noteDetails = wrapper.findComponent('[data-testid="note-details-component"]');
      const titleInput = noteDetails.find('[data-testid="edit-title-input"]');
      const contentInput = noteDetails.find('[data-testid="edit-content-input"]');

      await titleInput.setValue('Date Test Note');
      await contentInput.setValue('Testing date');
      
      const saveButton = noteDetails.find('[data-testid="save-note-button"]');
      await saveButton!.trigger('click');

      await flushPromises();
      await wrapper.vm.$nextTick();

      const bootstrap = bootstrapNotes();
      const store = bootstrap.useStore();
      const newNote = store.notes.find(n => n.title === 'Date Test Note');
      
      expect(newNote).toBeDefined();
      expect(newNote!.last_modified_utc.getTime()).toBe(testDate.getTime());
    });

    it('should preserve original date when updating existing note', async () => {
      const originalDate = new Date('2024-01-10T08:00:00Z');
      mockCurrentTime.setDate(originalDate);

      const wrapper = mount(NotesPage);
      
      await flushPromises();
      await wrapper.vm.$nextTick();

      const noteItems = wrapper.findAll('[data-testid="note-item"]');
      const firstNote = mockData.notes[0];

      await noteItems[0].trigger('click');
      await wrapper.vm.$nextTick();

      mockCurrentTime.advanceTimeBy(3600000);

      const noteDetails = wrapper.findComponent('[data-testid="note-details-component"]');
      const titleInput = noteDetails.find('[data-testid="edit-title-input"]');
      await titleInput.setValue('Updated After Time Advance');
      
      const saveButton = noteDetails.find('[data-testid="save-note-button"]');
      await saveButton!.trigger('click');

      await flushPromises();
      await wrapper.vm.$nextTick();

      const bootstrap = bootstrapNotes();
      const store = bootstrap.useStore();
      const updatedNote = store.notes.find(n => n.id === firstNote.id);
      
      expect(updatedNote).toBeDefined();
      expect(updatedNote!.last_modified_utc.getTime()).toBe(mockCurrentTime.getCurrentTime().getTime());
    });
  });

  describe('Deleting a Note', () => {
    it('should remove note from list and repository when deleted', async () => {
      const wrapper = mount(NotesPage);
      
      await flushPromises();
      await wrapper.vm.$nextTick();

      const initialNoteCount = wrapper.findAll('[data-testid="note-item"]').length;
      const firstNote = mockData.notes[0];

      const noteItems = wrapper.findAll('[data-testid="note-item"]');
      await noteItems[0].trigger('click');
      await wrapper.vm.$nextTick();

      const deleteButton = wrapper.find('[data-testid="delete-note-button"]');
      expect(deleteButton).toBeDefined();
      await deleteButton!.trigger('click');

      await flushPromises();
      await wrapper.vm.$nextTick();

      const finalNoteCount = wrapper.findAll('[data-testid="note-item"]').length;
      expect(finalNoteCount).toBe(initialNoteCount - 1);

      expect(wrapper.text()).not.toContain(firstNote.title);

      const bootstrap = bootstrapNotes();
      const store = bootstrap.useStore();
      const deletedNote = store.notes.find(n => n.id === firstNote.id);
      expect(deletedNote).toBeUndefined();

      const modal = wrapper.find('[data-testid="note-details-modal"]');
      expect(modal.exists()).toBe(false);
    });
  });
});

