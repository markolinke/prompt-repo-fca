import type { CurrentTimeProviderPort } from '../time_provider/CurrentTimeProviderPort';

export class MockCurrentTime implements CurrentTimeProviderPort {
    private now: number;
    private timezone: string;
    
    constructor(now: number | Date, timezone: string = 'UTC') {
        this.now = typeof now === 'number' ? now : now.valueOf();
        this.timezone = timezone;
    }

    getCurrentTime(): Date {
        return new Date(this.now);
    }

    getTimezone(): string {
        return this.timezone;
    }

    advanceTimeBy(milliseconds: number): void {
        this.now += milliseconds;
    }

    setTimezone(timezone: string): void {
        this.timezone = timezone;
    }

    setDate(date: Date): void {
        this.now = date.valueOf();
    }
}