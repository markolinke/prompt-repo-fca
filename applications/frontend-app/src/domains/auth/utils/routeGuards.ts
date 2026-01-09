import type { RouteLocationNormalized, NavigationGuardNext } from 'vue-router';

export interface AuthStoreShape {
    isAuthenticated: boolean;
    loading: boolean;
    initializeAuth(): void;
}

/**
 * Create a route guard function that checks authentication.
 * Routes are protected by default unless explicitly marked with meta.isPublic = true.
 * Redirects to login if not authenticated.
 */
export function createAuthGuard(
    getAuthStore: () => AuthStoreShape,
    loginRouteName: string = 'login'
) {
    return (
        to: RouteLocationNormalized,
        _from: RouteLocationNormalized,
        next: NavigationGuardNext
    ) => {
        const authStore = getAuthStore();
        
        // Check if route is public (explicitly marked as public)
        const isPublic = to.matched.some(record => record.meta.isPublic === true);
        
        // If route is public, allow access immediately (no need to initialize auth)
        if (isPublic) {
            next();
            return;
        }
        
        // Route is protected (default behavior)
        // Initialize auth state from storage if not already initialized
        // This ensures tokens are loaded on first navigation to protected routes
        if (!authStore.isAuthenticated && !authStore.loading) {
            authStore.initializeAuth();
        }
        
        // Check if user is authenticated
        if (!authStore.isAuthenticated) {
            // Store intended destination for redirect after login
            next({ 
                name: loginRouteName, 
                query: { redirect: to.fullPath } 
            });
        } else {
            // User is authenticated, allow access
            next();
        }
    };
}

