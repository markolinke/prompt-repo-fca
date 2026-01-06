import { vi } from 'vitest';
import { PromptService } from '../services/PromptService';
import { MockPromptRepository } from '../repositories/MockPromptRepository';
import { createPromptsStore } from '../store/PromptsStore';

/**
 * Mocks the bootstrapPrompts function for integration tests.
 * 
 * IMPORTANT: This must be called at the top level of your test file,
 * before any imports that use the bootstrap.
 * 
 * Creates a factory that returns fresh instances for each bootstrap call,
 * ensuring complete test isolation.
 * 
 * Usage:
 * ```typescript
 * import { mockBootstrapPrompts } from '../testHelpers';
 * mockBootstrapPrompts(); // Call at top level
 * 
 * import PromptsPage from '../pages/PromptsPage.vue'; // Now safe to import
 * ```
 */
export const mockBootstrapPrompts = () => {
  vi.mock('../bootstrap', () => {
    return {
      bootstrapPrompts: () => {
        const repository = new MockPromptRepository();
        const service = new PromptService(repository);
        const store = createPromptsStore(service);
        return {
          useStore: store,
          routes: [],
        };
      },
    };
  });
};

