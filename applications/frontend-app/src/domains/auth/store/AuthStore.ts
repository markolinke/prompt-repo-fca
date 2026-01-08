import { defineStore } from 'pinia';
import { User } from '../entities/User';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
}

type AuthServiceShape = {
    getCurrentUser(): Promise<User>;
};

export const createAuthStore = (authService: AuthServiceShape) => {
    return defineStore('auth', {
        state: (): AuthState => ({
            user: null,
            token: null,
            isAuthenticated: false,
            loading: false,
            error: null,
        }),

        actions: {
            async fetchCurrentUser(): Promise<void> {
                this.loading = true;
                this.error = null;
                try {
                    this.user = await authService.getCurrentUser();
                    // Phase 2: Set mock token for now
                    this.token = 'mock-token';
                    this.isAuthenticated = true;
                } catch (error) {
                    this.error = error instanceof Error ? error.message : 'Failed to fetch user';
                    this.isAuthenticated = false;
                } finally {
                    this.loading = false;
                }
            },

            logout(): void {
                this.user = null;
                this.token = null;
                this.isAuthenticated = false;
            },
        },

        getters: {
            // Getter that returns a function for token retrieval
            getToken: (state): (() => string | null) => {
                return () => state.token;
            },
        },
    });
};

