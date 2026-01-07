import type { HttpClientPort } from "@/common/http/HttpClientPort";
import { Note } from "../entities/Note";
import type { NoteRepositoryPort } from "./NotesRepositoryPort";

export class HttpNoteRepository implements NoteRepositoryPort {
    constructor(
        private readonly apiClient: HttpClientPort
    ) {}

    getNotes(): Promise<Note[]> {
        return this.apiClient.get('/notes');
    }

    getNoteById(id: string): Promise<Note> {
        return this.apiClient.get(`/notes/${id}`);
    }

    createNote(note: Note): Promise<void> {
        return this.apiClient.post('/notes', note);
    }
    
    updateNote(note: Note): Promise<void> {
        return this.apiClient.put(`/notes/${note.id}`, note);
    }

    deleteNote(id: string): Promise<void> {
        return this.apiClient.delete(`/notes/${id}`);
    }

    searchNotes(query: string): Promise<Note[]> {
        return this.apiClient.get(`/notes/search?query=${query}`);
    }
}