import type { TokenRepositoryPort } from './TokenRepositoryPort';

/**
 * Mock token repository implementation for testing and development.
 * Tokens are stored in memory and lost when the repository instance is destroyed.
 */
export class MockTokenRepository implements TokenRepositoryPort {
    private accessToken: string | null = null;

    setAccessToken(token: string): void {
        this.accessToken = token;
    }

    getAccessToken(): string | null {
        return this.accessToken;
    }

    clearTokens(): void {
        this.accessToken = null;
    }

    hasTokens(): boolean {
        return !!this.accessToken;
    }
}

