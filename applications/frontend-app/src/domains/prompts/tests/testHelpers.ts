import { vi } from 'vitest';
import { PromptService } from '../services/PromptService';
import { MockPromptRepository } from '../repositories/MockPromptRepository';
import { createPromptsStore } from '../store/PromptsStore';
import { createTestDebouncer } from '@/common/time/tests/DebouncerTestHelper';

/**
 * Mock timeout instance and debouncer used in tests for manual control of time-based operations.
 * Tests can use mockTimeout.advanceBy(ms) or mockTimeout.runAll() to control
 * when callbacks execute, making tests deterministic and fast.
 */
export const { debouncer: mockSearchDebouncer, mockTimeout } = createTestDebouncer();

/**
 * Mocks the bootstrapPrompts function for integration tests.
 * 
 * IMPORTANT: This must be called at the top level of your test file,
 * before any imports that use the bootstrap.
 * 
 * Creates a factory that returns fresh instances for each bootstrap call,
 * ensuring complete test isolation.
 * 
 * The mock uses MockTimeout instead of real setTimeout, allowing tests
 * to control time manually via mockTimeout.advanceBy() or mockTimeout.runAll().
 * 
 * Usage:
 * ```typescript
 * import { mockBootstrapPrompts, mockTimeout } from '../testHelpers';
 * mockBootstrapPrompts(); // Call at top level
 * 
 * import PromptsPage from '../pages/PromptsPage.vue'; // Now safe to import
 * 
 * // In your test:
 * await searchInput.setValue('Design');
 * mockTimeout.advanceBy(500); // Trigger debounce manually
 * await wrapper.vm.$nextTick();
 * ```
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

