import { MockTimeout } from './MockTimeout';
import { createDebouncer } from '../Debouncer';
import type { TimeoutPort } from '../TimeoutPort';

/**
 * Creates a debouncer for testing that uses MockTimeout.
 * This allows tests to manually control when callbacks execute.
 * 
 * @param mockTimeout - The MockTimeout instance to use (default: new instance)
 * @param delayMs - Delay in milliseconds (default: 500)
 * @returns An object with the debouncer function and the mockTimeout for control
 * 
 * @example
 * ```typescript
 * const { debouncer, mockTimeout } = createTestDebouncer();
 * 
 * debouncer(() => performSearch());
 * mockTimeout.advanceBy(500); // Manually trigger
 * ```
 */
export const createTestDebouncer = (
  mockTimeout: MockTimeout = new MockTimeout(),
  delayMs: number = 500
) => {
  return {
    debouncer: createDebouncer(mockTimeout as TimeoutPort, delayMs),
    mockTimeout,
  };
};

