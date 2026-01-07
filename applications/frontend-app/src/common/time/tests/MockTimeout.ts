import type { TimeoutPort, TimeoutHandle } from '../timeout/TimeoutPort';

type ScheduledCallback = {
  id: TimeoutHandle;
  runAt: number;
  callback: () => void;
};

export class MockTimeout implements TimeoutPort {
  private now = 0;
  private nextId: TimeoutHandle = 1;
  private scheduled: ScheduledCallback[] = [];

  setTimeout(callback: () => void, delay: number): TimeoutHandle {
    const id = this.nextId++;
    const runAt = this.now + delay;
    this.scheduled.push({ id, runAt, callback });
    this.scheduled.sort((a, b) => a.runAt - b.runAt);
    return id;
  }

  clearTimeout(handle: TimeoutHandle): void {
    this.scheduled = this.scheduled.filter(task => task.id !== handle);
  }

  /**
   * Advances the virtual clock by the given milliseconds and
   * executes any callbacks that are due.
   */
  advanceBy(ms: number): void {
    this.now += ms;
    this.flushDue();
  }

  /**
   * Runs all scheduled callbacks, regardless of their delay.
   */
  runAll(): void {
    // Keep advancing time to the next scheduled task until none remain
    while (this.scheduled.length > 0) {
      const next = this.scheduled[0];
      this.now = next.runAt;
      this.flushDue();
    }
  }

  /**
   * Resets the mock timeout to its initial state.
   * Useful for test isolation between test cases.
   */
  reset(): void {
    this.now = 0;
    this.nextId = 1;
    this.scheduled = [];
  }

  private flushDue(): void {
    const due = this.scheduled.filter(task => task.runAt <= this.now);
    const remaining = this.scheduled.filter(task => task.runAt > this.now);
    this.scheduled = remaining;

    for (const task of due) {
      task.callback();
    }
  }
}


