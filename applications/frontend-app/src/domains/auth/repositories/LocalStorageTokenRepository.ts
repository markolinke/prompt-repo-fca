import type { TokenRepositoryPort } from './TokenRepositoryPort';

/**
 * Token repository implementation using browser localStorage.
 * Provides persistent token storage across browser sessions.
 */
export class LocalStorageTokenRepository implements TokenRepositoryPort {
    private readonly ACCESS_TOKEN_KEY = 'auth_access_token';

    setAccessToken(token: string): void {
        localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
    }

    getAccessToken(): string | null {
        return localStorage.getItem(this.ACCESS_TOKEN_KEY);
    }

    clearTokens(): void {
        localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    }

    hasTokens(): boolean {
        return !!this.getAccessToken();
    }
}

