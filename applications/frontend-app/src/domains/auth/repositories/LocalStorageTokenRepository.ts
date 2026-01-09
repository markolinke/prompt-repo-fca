import type { TokenRepositoryPort } from './TokenRepositoryPort';

/**
 * Token repository implementation using browser localStorage.
 * Provides persistent token storage across browser sessions.
 */
export class LocalStorageTokenRepository implements TokenRepositoryPort {
    private readonly ACCESS_TOKEN_KEY = 'auth_access_token';
    private readonly REFRESH_TOKEN_KEY = 'auth_refresh_token';

    setAccessToken(token: string): void {
        localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
    }

    getAccessToken(): string | null {
        return localStorage.getItem(this.ACCESS_TOKEN_KEY);
    }

    setRefreshToken(token: string): void {
        localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
    }

    getRefreshToken(): string | null {
        return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    }

    clearTokens(): void {
        localStorage.removeItem(this.ACCESS_TOKEN_KEY);
        localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    }

    hasTokens(): boolean {
        return !!this.getAccessToken() && !!this.getRefreshToken();
    }
}

