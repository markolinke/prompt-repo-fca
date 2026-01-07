import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BrowserTimeout } from '../BrowserTimeout';

describe('BrowserTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetAllMocks();
  });

  it('delegates setTimeout to the global setTimeout', () => {
    const spy = vi.spyOn(globalThis, 'setTimeout');
    const bt = new BrowserTimeout();
    const callback = vi.fn();

    bt.setTimeout(callback, 500);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(expect.any(Function), 500);
  });

  it('delegates clearTimeout to the global clearTimeout', () => {
    const spy = vi.spyOn(globalThis, 'clearTimeout');
    const bt = new BrowserTimeout();
    const callback = vi.fn();

    const handle = bt.setTimeout(callback, 500);
    bt.clearTimeout(handle);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(handle);
  });

  it('executes the callback after the specified delay', () => {
    const bt = new BrowserTimeout();
    const callback = vi.fn();

    bt.setTimeout(callback, 500);

    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);

    expect(callback).toHaveBeenCalledTimes(1);
  });
});


