import { vi } from 'vitest';
import { NoteService } from '../services/NotesService';
import { MockNoteRepository } from '../repositories/MockNotesRepository';
import { createNotesStore } from '../store/NotesStore';
import { createTestDebouncer } from '@/common/time/tests/DebouncerTestHelper';
import { MockCurrentTime } from '@/common/time/tests/MockCurrentTime';

export const { debouncer: mockSearchDebouncer, mockTimeout } = createTestDebouncer();

/**
 * Mocks the bootstrapNotes function for integration tests.
 * 
 * IMPORTANT: Must be called at the top level of your test file, before any imports that use the bootstrap.
 * See common/time/README.md for usage examples.
 */
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
          getCurrentTimeProvider: () => new MockCurrentTime(new Date(), 'UTC'),
        };
      },
    };
  });
};

