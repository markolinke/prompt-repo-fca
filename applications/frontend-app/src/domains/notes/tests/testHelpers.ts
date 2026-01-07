import { vi } from 'vitest';
import { NoteService } from '../services/NotesService';
import { MockNoteRepository } from '../repositories/MockNotesRepository';
import { createNotesStore } from '../store/NotesStore';
import { createTestDebouncer, MockCurrentTime } from '@/common/time';

export const { debouncer: mockSearchDebouncer, mockTimeout } = createTestDebouncer();
export const mockCurrentTime = new MockCurrentTime(new Date('2024-01-15T10:00:00Z'), 'UTC');

export const mockBootstrapNotes = () => {
  vi.mock('../bootstrap', () => {
    return {
      bootstrapNotes: () => {
        const repository = new MockNoteRepository();
        const service = new NoteService(repository);
        const store = createNotesStore(service);

        return {
          useStore: store,
          routes: [],
          createSearchDebouncer: () => mockSearchDebouncer,
          getCurrentTimeProvider: () => mockCurrentTime,
        };
      },
    };
  });
};

