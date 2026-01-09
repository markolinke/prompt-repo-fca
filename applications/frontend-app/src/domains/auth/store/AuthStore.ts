import { defineStore } from 'pinia';
import { User } from '../entities/User';
import { isTokenExpired } from '../utils/tokenUtils';

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
}

type AuthServiceShape = {
    getCurrentUser(): Promise<User>;
};

type TokenServiceShape = {
    setAccessToken(token: string): void;
    getAccessToken(): string | null;
    setRefreshToken(token: string): void;
    getRefreshToken(): string | null;
    clearTokens(): void;
    hasTokens(): boolean;
};

export const createAuthStore = (
    authService: AuthServiceShape,
    tokenService: TokenServiceShape
) => {
    return defineStore('auth', {
        state: (): AuthState => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            loading: false,
            error: null,
        }),

        actions: {
            /**
             * Initialize auth state from storage (call on app start)
             */
            initializeAuth(): void {
                const accessToken = tokenService.getAccessToken();
                const refreshToken = tokenService.getRefreshToken();
                
                if (accessToken && refreshToken && !isTokenExpired(accessToken)) {
                    this.accessToken = accessToken;
                    this.refreshToken = refreshToken;
                    this.isAuthenticated = true;
                    // Optionally fetch user on init (Phase 4.2)
                } else if (accessToken && isTokenExpired(accessToken)) {
                    // Token expired, clear it
                    this.clearAuth();
                }
            },

            /**
             * Set tokens and persist to storage
             */
            setTokens(accessToken: string, refreshToken: string): void {
                this.accessToken = accessToken;
                this.refreshToken = refreshToken;
                tokenService.setAccessToken(accessToken);
                tokenService.setRefreshToken(refreshToken);
                this.isAuthenticated = true;
            },

            /**
             * Clear all auth state and storage
             */
            clearAuth(): void {
                this.user = null;
                this.accessToken = null;
                this.refreshToken = null;
                this.isAuthenticated = false;
                tokenService.clearTokens();
            },

            async fetchCurrentUser(): Promise<void> {
                this.loading = true;
                this.error = null;
                try {
                    this.user = await authService.getCurrentUser();
                    this.isAuthenticated = true;
                } catch (error) {
                    this.error = error instanceof Error ? error.message : 'Failed to fetch user';
                    this.isAuthenticated = false;
                    // If 401, clear auth state
                    if (error instanceof Error && error.message.includes('401')) {
                        this.clearAuth();
                    }
                } finally {
                    this.loading = false;
                }
            },

            logout(): void {
                this.clearAuth();
            },
        },

        getters: {
            /**
             * Get current access token (for HTTP client)
             */
            getToken: (state): (() => string | null) => {
                return () => state.accessToken;
            },

            /**
             * Check if access token is expired
             */
            isAccessTokenExpired(): boolean {
                if (!this.accessToken) return true;
                return isTokenExpired(this.accessToken);
            },
        },
    });
};

