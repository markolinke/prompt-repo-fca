import { vi } from 'vitest';
import { PromptService } from '../services/PromptService';
import { MockPromptRepository } from '../repositories/MockPromptRepository';
import { createPromptsStore } from '../store/PromptsStore';
import { MockTimeout } from '@/common/time/tests/MockTimeout';
import type { TimeoutHandle } from '@/common/time/TimeoutPort';

/**
 * Mock timeout instance used in tests for manual control of time-based operations.
 * Tests can use mockTimeout.advanceBy(ms) or mockTimeout.runAll() to control
 * when callbacks execute, making tests deterministic and fast.
 */
export const mockTimeout = new MockTimeout();

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
          let handle: TimeoutHandle | null = null;

          return (callback: () => void) => {
            if (handle !== null) {
              mockTimeout.clearTimeout(handle);
            }

            handle = mockTimeout.setTimeout(() => {
              callback();
              handle = null;
            }, 500);
          };
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

