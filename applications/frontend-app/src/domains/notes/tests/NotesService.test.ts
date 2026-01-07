import { describe, it, expect, beforeEach } from 'vitest';
import { ValidationError } from '@/common/errors/DomainError';
import { NoteNotFoundError } from '@/common/errors/DomainError';
import { NoteService } from '../services/NotesService';
import { MockNoteRepository } from '../repositories/MockNotesRepository';
import { Note } from '../entities/Note';
import { mockData } from './NotesMockData';

describe('NoteService', () => {
    let service: NoteService;
    let repository: MockNoteRepository;

    beforeEach(() => {
        repository = new MockNoteRepository();
        service = new NoteService(repository);
    });

    describe('getNotes', () => {
        it('should return array of notes from repository', async () => {
            const notes = await service.getNotes();
            
            expect(notes).toBeInstanceOf(Array);
            expect(notes.length).toBeGreaterThan(0);
            expect(notes[0]).toBeInstanceOf(Note);
        });

        it('should return empty array when repository has no notes', async () => {
            const emptyRepository = new MockNoteRepository([]);
            const emptyService = new NoteService(emptyRepository);
            
            const notes = await emptyService.getNotes();
            
            expect(notes).toEqual([]);
        });

        it('should return notes with correct structure', async () => {
            const notes = await service.getNotes();
            
            notes.forEach(note => {
                expect(note).toHaveProperty('id');
                expect(note).toHaveProperty('title');
                expect(note).toHaveProperty('content');
                expect(note).toHaveProperty('last_modified_utc');
                expect(note).toHaveProperty('category');
                expect(note).toHaveProperty('tags');
            });
        });
    });

    describe('getNoteById', () => {
        it('should return note when found', async () => {
            const expectedNote = Note.fromPlainObject(mockData.notes[0]);
            
            const note = await service.getNoteById('1');
            
            expect(note).toBeInstanceOf(Note);
            expect(note.id).toBe('1');
            expect(note.title).toBe(expectedNote.title);
        });

        it('should throw NoteNotFoundError when note does not exist', async () => {
            await expect(service.getNoteById('non-existent-id')).rejects.toThrow(NoteNotFoundError);
        });

        it('should throw NoteNotFoundError with correct message', async () => {
            const nonExistentId = 'non-existent-id';
            
            await expect(service.getNoteById(nonExistentId)).rejects.toThrow(
                `Note with id ${nonExistentId} not found`
            );
        });

        it('should return correct note for different ids', async () => {
            const note1 = await service.getNoteById('1');
            const note2 = await service.getNoteById('2');
            
            expect(note1.id).toBe('1');
            expect(note2.id).toBe('2');
            expect(note1.title).not.toBe(note2.title);
        });
    });

    describe('createNote', () => {
        it('should successfully create note', async () => {
            const newNote = new Note(
                '5',
                'New Note',
                'Test content',
                new Date('2024-01-20T10:00:00Z'),
                'test/category',
                ['test', 'tag']
            );
            
            await service.createNote(newNote);
            
            const createdNote = await service.getNoteById('5');
            expect(createdNote).toEqual(newNote);
        });

        it('should add note to repository', async () => {
            const initialNotes = await service.getNotes();
            const initialCount = initialNotes.length;
            
            const newNote = new Note(
                '4',
                'Another Note',
                'Another content',
                new Date('2024-01-21T12:00:00Z'),
                null,
                []
            );
            
            await service.createNote(newNote);
            
            const updatedNotes = await service.getNotes();
            expect(updatedNotes.length).toBe(initialCount + 1);
        });

        it('should create note with all properties', async () => {
            const newNote = new Note(
                '5',
                'Full Note',
                'Full content',
                new Date('2024-01-22T14:30:00Z'),
                'full/category',
                ['tag1', 'tag2']
            );
            
            await service.createNote(newNote);
            
            const createdNote = await service.getNoteById('5');
            expect(createdNote.id).toBe('5');
            expect(createdNote.title).toBe('Full Note');
            expect(createdNote.content).toBe('Full content');
            expect(createdNote.last_modified_utc).toEqual(new Date('2024-01-22T14:30:00Z'));
            expect(createdNote.category).toBe('full/category');
            expect(createdNote.tags).toEqual(['tag1', 'tag2']);
        });

        it('should throw ValidationError when note is invalid', async () => {
            const invalidNote = new Note(
                '',
                '',
                '',
                new Date(),
                'full/category',
                ['tag1', 'tag2']
            );

            await expect(service.validateNote(invalidNote)).rejects.toThrow(ValidationError);
            await expect(service.validateNote(invalidNote)).rejects.toThrow('Validation failed: ID is required; Title is required; Content is required');
        });
    });

    describe('updateNote', () => {
        it('should successfully update existing note', async () => {
            const existingNote = await service.getNoteById('1');
            const updatedNote = new Note(
                existingNote.id,
                'Updated Title',
                existingNote.content,
                existingNote.last_modified_utc,
                existingNote.category,
                [...existingNote.tags]
            );
            
            await service.updateNote(updatedNote);
            
            const result = await service.getNoteById('1');
            expect(result.title).toBe('Updated Title');
        });

        it('should update all note properties', async () => {
            const updatedNote = new Note(
                '1',
                'New Title',
                'New Content',
                new Date('2024-01-23T16:00:00Z'),
                'new/category',
                ['new', 'tags']
            );
            
            await service.updateNote(updatedNote);
            
            const result = await service.getNoteById('1');
            expect(result.title).toBe('New Title');
            expect(result.content).toBe('New Content');
            expect(result.last_modified_utc).toEqual(new Date('2024-01-23T16:00:00Z'));
            expect(result.category).toBe('new/category');
            expect(result.tags).toEqual(['new', 'tags']);
        });

        it('should handle update of non-existent note gracefully', async () => {
            const nonExistentNote = new Note(
                '999',
                'Non-existent',
                'Content',
                new Date('2024-01-24T08:00:00Z'),
                null,
                []
            );
            
            // MockNoteRepository doesn't throw on update of non-existent, it just does nothing
            await expect(service.updateNote(nonExistentNote)).resolves.not.toThrow();
        });
    });

    describe('deleteNote', () => {
        it('should successfully delete note', async () => {
            // First verify note exists
            await expect(service.getNoteById('1')).resolves.toBeInstanceOf(Note);
            
            await service.deleteNote('1');
            
            // Then verify it's deleted
            await expect(service.getNoteById('1')).rejects.toThrow(NoteNotFoundError);
        });

        it('should remove note from repository', async () => {
            const initialNotes = await service.getNotes();
            const initialCount = initialNotes.length;
            
            await service.deleteNote('1');
            
            const updatedNotes = await service.getNotes();
            expect(updatedNotes.length).toBe(initialCount - 1);
            expect(updatedNotes.find(p => p.id === '1')).toBeUndefined();
        });

        it('should handle deletion of non-existent note gracefully', async () => {
            // MockNoteRepository doesn't throw on delete of non-existent, it just does nothing
            await expect(service.deleteNote('non-existent-id')).resolves.not.toThrow();
        });

        it('should only delete the specified note', async () => {
            const initialNotes = await service.getNotes();
            const initialCount = initialNotes.length;
            
            await service.deleteNote('1');
            
            const updatedNotes = await service.getNotes();
            expect(updatedNotes.length).toBe(initialCount - 1);
            // Verify other notes still exist
            await expect(service.getNoteById('2')).resolves.toBeInstanceOf(Note);
        });
    });

    describe('searchNotes', () => {
        it('should return all notes when query is empty string', async () => {
            const allNotes = await service.getNotes();
            const searchResults = await service.searchNotes('');
            
            expect(searchResults).toEqual(allNotes);
            expect(searchResults.length).toBe(allNotes.length);
        });

        it('should return all notes when query is null', async () => {
            const allNotes = await service.getNotes();
            const searchResults = await service.searchNotes(null as any);
            
            expect(searchResults).toEqual(allNotes);
            expect(searchResults.length).toBe(allNotes.length);
        });

        it('should return notes whose title contains the search term', async () => {
            const results = await service.searchNotes('Design');
            
            expect(results.length).toBe(2);
            expect(results.some(p => p.id === '1')).toBe(true);
            expect(results.some(p => p.id === '2')).toBe(true);
            results.forEach(note => {
                expect(note.title).toContain('Design');
            });
        });

        it('should return notes whose category contains the search term', async () => {
            const results = await service.searchNotes('coding');
            
            expect(results.length).toBe(1);
            expect(results[0].id).toBe('4');
            expect(results[0].category).toContain('coding');
        });

        it('should return notes matching either title or category', async () => {
            // Search for 'design' (lowercase) - should match categories but not titles (which have 'Design')
            const results = await service.searchNotes('design');
            
            expect(results.length).toBe(2);
            expect(results.some(p => p.id === '1')).toBe(true);
            expect(results.some(p => p.id === '2')).toBe(true);
            // Verify each result matches either title or category
            results.forEach(note => {
                const matchesTitle = note.title.includes('design');
                const matchesCategory = note.category?.includes('design') ?? false;
                expect(matchesTitle || matchesCategory).toBe(true);
            });
        });

        it('should return notes where title matches even if category is null', async () => {
            const results = await service.searchNotes('without');
            
            expect(results.length).toBe(2);
            expect(results.some(p => p.id === '3')).toBe(true);
            expect(results.some(p => p.id === '4')).toBe(true);
            results.forEach(note => {
                expect(note.title).toContain('without');
            });
        });

        it('should return empty array when search term does not match any note', async () => {
            const results = await service.searchNotes('nonexistent-term-that-will-never-match');
            
            expect(results).toEqual([]);
            expect(results.length).toBe(0);
        });

        it('should return all notes when query is undefined', async () => {
            const allNotes = await service.getNotes();
            const searchResults = await service.searchNotes(undefined as any);
            
            expect(searchResults).toEqual(allNotes);
            expect(searchResults.length).toBe(allNotes.length);
        });
    });
});

