import { Note } from "../entities/Note";
import type { NoteRepositoryPort } from "../repositories/NotesRepositoryPort";

export class NoteService {
    constructor(
        private readonly repository: NoteRepositoryPort
    ) {}

    async getNotes(): Promise<Note[]> {
        return this.repository.getNotes();
    }

    async getNoteById(id: string): Promise<Note> {
        return this.repository.getNoteById(id);
    }

    async createNote(note: Note): Promise<void> {
        return this.repository.createNote(note);
    }

    async updateNote(note: Note): Promise<void> {
        return this.repository.updateNote(note);
    }

    async deleteNote(id: string): Promise<void> {
        return this.repository.deleteNote(id);
    }

    async searchNotes(query: string): Promise<Note[]> {
        return this.repository.searchNotes(query);
    }
}

