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
     * Clear access token
     */
    clearTokens(): void;

    /**
     * Check if access token exists
     */
    hasTokens(): boolean;
}

