import type { TokenRepositoryPort } from './TokenRepositoryPort';

/**
 * Mock token repository implementation for testing and development.
 * Tokens are stored in memory and lost when the repository instance is destroyed.
 */
export class MockTokenRepository implements TokenRepositoryPort {
    private accessToken: string | null = null;
    private refreshToken: string | null = null;

    setAccessToken(token: string): void {
        this.accessToken = token;
    }

    getAccessToken(): string | null {
        return this.accessToken;
    }

    setRefreshToken(token: string): void {
        this.refreshToken = token;
    }

    getRefreshToken(): string | null {
        return this.refreshToken;
    }

    clearTokens(): void {
        this.accessToken = null;
        this.refreshToken = null;
    }

    hasTokens(): boolean {
        return !!this.accessToken && !!this.refreshToken;
    }
}

