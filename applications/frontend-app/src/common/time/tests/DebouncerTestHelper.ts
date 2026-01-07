import { MockTimeout } from './MockTimeout';
import { createDebouncer } from '../Debouncer';
import type { TimeoutPort } from '../TimeoutPort';

/**
 * Creates a debouncer for testing that uses MockTimeout.
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

