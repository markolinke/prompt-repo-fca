import { vi } from 'vitest';
import { PromptService } from '../services/PromptService';
import { MockPromptRepository } from '../repositories/MockPromptRepository';
import { createPromptsStore } from '../store/PromptsStore';
import { createTestDebouncer } from '@/common/time/tests/DebouncerTestHelper';

export const { debouncer: mockSearchDebouncer, mockTimeout } = createTestDebouncer();

/**
 * Mocks the bootstrapPrompts function for integration tests.
 * 
 * IMPORTANT: Must be called at the top level of your test file, before any imports that use the bootstrap.
 * See common/time/README.md for usage examples.
 */
export const mockBootstrapPrompts = () => {
  vi.mock('../bootstrap', () => {
    return {
      bootstrapPrompts: () => {
        const repository = new MockPromptRepository();
        const service = new PromptService(repository);
        const store = createPromptsStore(service);

        const createSearchDebouncer = () => {
          return mockSearchDebouncer;
        };

        return {
          useStore: store,
          routes: [],
          createSearchDebouncer,
        };
      },
    };
  });
};

