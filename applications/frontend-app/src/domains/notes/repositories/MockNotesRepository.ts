import { Note } from "../entities/Note";
import { NoteNotFoundError } from "../../../common/errors/DomainError";
import type{ NoteRepositoryPort } from "./NotesRepositoryPort";
import { mockData } from "../tests/NotesMockData";

export class MockNoteRepository implements NoteRepositoryPort {
    private notes: Note[];
    private readonly _defaultNotes: Note[] = mockData.notes.map(note => Note.fromPlainObject(note));

    constructor(initialNotes: Note[] | undefined = undefined) {
        this.notes = initialNotes ?? this._defaultNotes;
    }

    getNotes(): Promise<Note[]> {
        return Promise.resolve(this.notes);
    }

    getNoteById(id: string): Promise<Note> {
        const note = this.notes.find(note => note.id === id) ?? null;
        if (note === null) {
            return Promise.reject(new NoteNotFoundError(id));
        }
        return Promise.resolve(note);
    }

    createNote(note: Note): Promise<void> {
        this.notes.push(note);
        return Promise.resolve();
    }

    updateNote(note: Note): Promise<void> {
        const index = this.notes.findIndex(p => p.id === note.id);
        if (index !== -1) {
            this.notes[index] = note;
        }
        return Promise.resolve();
    }

    deleteNote(id: string): Promise<void> {
        this.notes = this.notes.filter(note => note.id !== id);
        return Promise.resolve();
    }

    searchNotes(query: string): Promise<Note[]> {
        if (!query) {
            return Promise.resolve(this.notes);
        }
        return Promise.resolve(this.notes.filter(note => note.title.includes(query) || note.category?.includes(query)));
    }
}
