import type { TimeoutPort, TimeoutHandle } from './TimeoutPort';

/**
 * Creates a debounced function that delays execution until after
 * the specified delay has passed since the last invocation.
 * 
 * @param timeoutClient - The timeout implementation to use
 * @param delayMs - Delay in milliseconds (default: 500)
 * @returns A debounced function that cancels previous calls
 * 
 * @example
 * ```typescript
 * const debouncer = createDebouncer(timeoutClient, 500);
 * const debouncedSearch = debouncer(() => {
 *   performSearch();
 * });
 * 
 * // Multiple rapid calls will only execute the last one
 * debouncedSearch(); // Cancelled
 * debouncedSearch(); // Cancelled  
 * debouncedSearch(); // Executes after 500ms
 * ```
 */
export const createDebouncer = (
  timeoutClient: TimeoutPort,
  delayMs: number = 500
) => {
  let handle: TimeoutHandle | null = null;

  return (callback: () => void) => {
    if (handle !== null) {
      timeoutClient.clearTimeout(handle);
    }

    handle = timeoutClient.setTimeout(() => {
      callback();
      handle = null;
    }, delayMs);
  };
};

