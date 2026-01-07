export type TimeoutHandle = number;

export interface TimeoutPort {
  setTimeout(callback: () => void, delay: number): TimeoutHandle;
  clearTimeout(handle: TimeoutHandle): void;
}


