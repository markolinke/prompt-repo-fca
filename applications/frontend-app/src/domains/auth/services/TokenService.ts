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
     * Clear access token
     */
    clearTokens(): void {
        this.tokenRepository.clearTokens();
    }

    /**
     * Check if access token exists
     */
    hasTokens(): boolean {
        return this.tokenRepository.hasTokens();
    }
}