import type { CurrentTimeProviderPort } from './CurrentTimeProviderPort';
import { BrowserTime } from './BrowserTime';

export const createCurrentTimeProvider = (): CurrentTimeProviderPort => {
    return new BrowserTime();
}
