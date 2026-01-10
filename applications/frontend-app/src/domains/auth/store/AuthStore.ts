import { defineStore } from 'pinia';
import { User } from '../entities/User';
import { isTokenExpired } from '../utils/tokenUtils';
import { AuthService } from '../services/AuthService';
import { TokenService } from '../services/TokenService';

interface AuthState {
    user: User | null;
    accessToken: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
}

export const createAuthStore = (
    authService: AuthService,
    tokenService: TokenService
) => {
    return defineStore('auth', {
        state: (): AuthState => ({
            user: null,
            accessToken: null,
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
                
                if (accessToken && !isTokenExpired(accessToken)) {
                    this.accessToken = accessToken;
                    this.isAuthenticated = true;
                    // Optionally fetch user on init (Phase 4.2)
                } else if (accessToken && isTokenExpired(accessToken)) {
                    // Token expired, clear it
                    this.clearAuth();
                }
            },

            /**
             * Set access token and persist to storage
             */
            setAccessToken(accessToken: string): void {
                this.accessToken = accessToken;
                tokenService.setAccessToken(accessToken);
                this.isAuthenticated = true;
            },

            /**
             * Clear all auth state and storage
             */
            clearAuth(): void {
                this.user = null;
                this.accessToken = null;
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
                } finally {
                    this.loading = false;
                }
            },

            async login(email: string, password: string): Promise<void> {
                this.loading = true;
                this.error = null;
                try {
                    const { accessToken } = await authService.login(email, password);
                    this.setAccessToken(accessToken);
                    // Automatically fetch user info after login
                    await this.fetchCurrentUser();
                } catch (error) {
                    this.error = error instanceof Error ? error.message : 'Login failed';
                    this.isAuthenticated = false;
                    throw error; // Re-throw so component can handle
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

