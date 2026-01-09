import type { AuthRepositoryPort } from '../repositories/AuthRepositoryPort';
import { TokenService } from './TokenService';
import { isTokenExpired } from '../utils/tokenUtils';

/**
 * Service for refreshing authentication tokens.
 * This service is used by the refresh callback and doesn't depend on the store.
 */
export class RefreshTokenService {
    constructor(
        private readonly refreshRepository: AuthRepositoryPort,
        private readonly tokenService: TokenService
    ) {}

    /**
     * Refresh access token using refresh token.
     * Updates tokens in storage on success.
     * 
     * @returns true if refresh succeeded, false otherwise
     */
    async refreshAccessToken(): Promise<boolean> {
        const refreshToken = this.tokenService.getRefreshToken();
        
        // Check if refresh token exists and is not expired
        if (!refreshToken) {
            return false;
        }
        
        if (isTokenExpired(refreshToken)) {
            // Refresh token expired, clear everything
            this.tokenService.clearTokens();
            return false;
        }

        try {
            // Call refresh endpoint
            const response = await this.refreshRepository.refreshToken(refreshToken);
            
            // Update tokens in storage
            this.tokenService.setAccessToken(response.access_token);
            this.tokenService.setRefreshToken(response.refresh_token);
            
            return true;
        } catch (error) {
            // Refresh failed, clear tokens
            this.tokenService.clearTokens();
            return false;
        }
    }
}

