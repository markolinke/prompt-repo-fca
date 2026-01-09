import type { TokenRepositoryPort } from '../repositories/TokenRepositoryPort';

/**
 * Service for managing JWT tokens.
 * Provides a thin facade over token repository for business logic and orchestration.
 */
export class TokenService {
    constructor(
        private readonly tokenRepository: TokenRepositoryPort
    ) {}

    /**
     * Store access token
     */
    setAccessToken(token: string): void {
        this.tokenRepository.setAccessToken(token);
    }

    /**
     * Get access token
     */
    getAccessToken(): string | null {
        return this.tokenRepository.getAccessToken();
    }

    /**
     * Store refresh token
     */
    setRefreshToken(token: string): void {
        this.tokenRepository.setRefreshToken(token);
    }

    /**
     * Get refresh token
     */
    getRefreshToken(): string | null {
        return this.tokenRepository.getRefreshToken();
    }

    /**
     * Clear all tokens
     */
    clearTokens(): void {
        this.tokenRepository.clearTokens();
    }

    /**
     * Check if tokens exist
     */
    hasTokens(): boolean {
        return this.tokenRepository.hasTokens();
    }
}