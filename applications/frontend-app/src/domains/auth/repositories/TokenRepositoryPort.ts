/**
 * Port interface for token storage operations.
 * Abstracts token persistence to allow different storage implementations
 * (localStorage, sessionStorage, in-memory for testing, etc.)
 */
export interface TokenRepositoryPort {
    /**
     * Store access token
     */
    setAccessToken(token: string): void;

    /**
     * Get access token
     */
    getAccessToken(): string | null;

    /**
     * Store refresh token
     */
    setRefreshToken(token: string): void;

    /**
     * Get refresh token
     */
    getRefreshToken(): string | null;

    /**
     * Clear all tokens
     */
    clearTokens(): void;

    /**
     * Check if tokens exist
     */
    hasTokens(): boolean;
}

