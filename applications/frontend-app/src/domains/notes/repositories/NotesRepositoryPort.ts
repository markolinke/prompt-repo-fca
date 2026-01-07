import { Note } from "../entities/Note";

export interface NoteRepositoryPort {
    getNotes(): Promise<Note[]>;
    getNoteById(id: string): Promise<Note>;
    createNote(note: Note): Promise<void>;
    updateNote(note: Note): Promise<void>;
    deleteNote(id: string): Promise<void>;
    searchNotes(query: string): Promise<Note[]>;
}