import { defineStore } from 'pinia';
import { Note } from '../entities/Note';
import { FlagsUtil } from '@/common/utils/FlagsUtil';

interface NotesState {
    notes: Note[];
    loading: boolean;
    error: string | null;
    actionFlags: FlagsUtil;
}

type NoteServiceShape = {
    getNotes(): Promise<Note[]>;
    getNoteById(id: string): Promise<Note>;
    createNote(note: Note): Promise<void>;
    updateNote(note: Note): Promise<void>;
    deleteNote(id: string): Promise<void>;
    searchNotes(query: string): Promise<Note[]>;
};

export const createNotesStore = (noteService: NoteServiceShape) => {
    return defineStore('notes', {
        state: (): NotesState => ({
            notes: [],
            loading: false,
            error: null,
            actionFlags: new FlagsUtil(),
        }),

        actions: {
            async fetchNotes(): Promise<void> {
                this.loading = true;
                this.error = null;

                try {
                    this.notes = await noteService.getNotes();
                } catch (error) {
                    this.error = error instanceof Error ? error.message : 'Failed to fetch notes';
                } finally {
                    this.loading = false;
                }
            },

            async createNote(note: Note): Promise<void> {
                this.loading = true;
                this.error = null;

                try {
                    await noteService.createNote(note);
                    this.notes = await noteService.getNotes();
                } catch (error) {
                    this.error = error instanceof Error ? error.message : 'Failed to create note';
                    throw error;
                } finally {
                    this.loading = false;
                }
            },

            async updateNote(note: Note): Promise<void> {
                this.loading = true;
                this.error = null;

                try {
                    await noteService.updateNote(note);
                    // Update the note in the local state
                    const index = this.notes.findIndex(p => p.id === note.id);
                    if (index !== -1) {
                        this.notes[index] = note;
                    }
                } catch (error) {
                    this.error = error instanceof Error ? error.message : 'Failed to update note';
                    throw error;
                } finally {
                    this.loading = false;
                }
            },

            async deleteNote(id: string): Promise<void> {
                this.loading = true;
                this.error = null;

                try {
                    await noteService.deleteNote(id);
                    this.notes = await noteService.getNotes();
                } catch (error) {
                    this.error = error instanceof Error ? error.message : 'Failed to delete note';
                    throw error;
                } finally {
                    this.loading = false;
                }
            },

            async searchNotes(query: string): Promise<void> {
                this.loading = true;
                this.error = null;

                try {
                    this.notes = await noteService.searchNotes(query);
                } catch (error) {
                    this.error = error instanceof Error ? error.message : 'Failed to search notes';
                } finally {
                    this.loading = false;
                }
            },
        },
    });
}
