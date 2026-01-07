import type { TimeoutPort, TimeoutHandle } from './TimeoutPort';

export class BrowserTimeout implements TimeoutPort {
  setTimeout(callback: () => void, delay: number): TimeoutHandle {
    return window.setTimeout(callback, delay);
  }

  clearTimeout(handle: TimeoutHandle): void {
    window.clearTimeout(handle);
  }
}


