import type { CurrentTimeProviderPort } from './CurrentTimeProviderPort';

export class BrowserTime implements CurrentTimeProviderPort {
    getCurrentTime(): Date {
        return new Date(Date.now());
    }

    getTimezone(): string {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
}
