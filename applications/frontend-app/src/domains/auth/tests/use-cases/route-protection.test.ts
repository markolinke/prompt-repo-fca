import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { createAuthGuard } from '../../utils/routeGuards';
import { mockBootstrapAuth, setupMockAppDependencies, navigateToRoute } from '../testHelpers';
import { bootstrapAuth } from '../../bootstrap';
import { defineComponent } from 'vue';

// Mock bootstrap before imports
mockBootstrapAuth();

// Create a simple test component
const TestHomePage = defineComponent({
    name: 'TestHomePage',
    template: '<div data-testid="home-page">Home Page</div>',
});

const TestLoginPage = defineComponent({
    name: 'TestLoginPage',
    template: '<div data-testid="login-page">Login Page</div>',
});

const TestNotesPage = defineComponent({
    name: 'TestNotesPage',
    template: '<div data-testid="notes-page">Notes Page</div>',
});

describe('Route Protection Integration', () => {
    let router: ReturnType<typeof createRouter>;
    let authBootstrap: ReturnType<typeof bootstrapAuth>;

    beforeEach(() => {
        setActivePinia(createPinia());
        setupMockAppDependencies();

        // Get fresh bootstrap instance
        authBootstrap = bootstrapAuth();

        // Create router with routes
        const routes: RouteRecordRaw[] = [
            {
                path: '/',
                name: 'home',
                component: TestHomePage,
                // Protected by default (no meta.isPublic)
            },
            {
                path: '/login',
                name: 'login',
                component: TestLoginPage,
                meta: { isPublic: true },
            },
            {
                path: '/notes',
                name: 'notes-list',
                component: TestNotesPage,
                // Protected by default (no meta.isPublic)
            },
        ];

        router = createRouter({
            history: createWebHistory(),
            routes,
        });

        // Set up route guard
        router.beforeEach(
            createAuthGuard(
                () => authBootstrap.useStore(),
                'login'
            )
        );
    });

    describe('As an unauthenticated user', () => {
        it('should be redirected to login when accessing protected route', async () => {
            // Given: User is not authenticated
            const store = authBootstrap.useStore();
            expect(store.isAuthenticated).toBe(false);

            // When: User navigates to protected route
            await router.push('/notes');

            // Then: Should be redirected to login with redirect query param
            expect(router.currentRoute.value.name).toBe('login');
            expect(router.currentRoute.value.query.redirect).toBe('/notes');
        });

        it('should be redirected to login when accessing home route', async () => {
            // Given: User is not authenticated
            const store = authBootstrap.useStore();
            expect(store.isAuthenticated).toBe(false);

            // When: User navigates to home
            await router.push('/');

            // Then: Should be redirected to login
            expect(router.currentRoute.value.name).toBe('login');
            expect(router.currentRoute.value.query.redirect).toBe('/');
        });

        it('should be able to access public login route', async () => {
            // Given: User is not authenticated
            const store = authBootstrap.useStore();
            expect(store.isAuthenticated).toBe(false);

            // When: User navigates to login
            await router.push('/login');

            // Then: Should be able to access login page
            expect(router.currentRoute.value.name).toBe('login');
        });
    });

    describe('As an authenticated user', () => {
        beforeEach(async () => {
            // Authenticate user
            const store = authBootstrap.useStore();
            await store.login('test@example.com', 'password123');
            expect(store.isAuthenticated).toBe(true);
        });

        it('should be able to access protected routes', async () => {
            // Given: User is authenticated
            const store = authBootstrap.useStore();
            expect(store.isAuthenticated).toBe(true);

            // When: User navigates to protected route
            await router.push('/notes');

            // Then: Should access the route
            expect(router.currentRoute.value.name).toBe('notes-list');
        });

        it('should be able to access home route', async () => {
            // Given: User is authenticated
            const store = authBootstrap.useStore();
            expect(store.isAuthenticated).toBe(true);

            // When: User navigates to home
            await router.push('/');

            // Then: Should access home
            expect(router.currentRoute.value.name).toBe('home');
        });

        it('should be able to access login page', async () => {
            // Given: User is authenticated
            const store = authBootstrap.useStore();
            expect(store.isAuthenticated).toBe(true);

            // When: User navigates to login
            await router.push('/login');

            // Then: Should access login page (allowed for public routes)
            expect(router.currentRoute.value.name).toBe('login');
        });
    });

    describe('Login redirect flow', () => {
        it('should preserve redirect query parameter after login', async () => {
            // Given: User is redirected to login from protected route
            const store = authBootstrap.useStore();
            expect(store.isAuthenticated).toBe(false);

            // Navigate to protected route (should redirect to login)
            await router.push('/notes');
            expect(router.currentRoute.value.name).toBe('login');
            expect(router.currentRoute.value.query.redirect).toBe('/notes');

            // When: User logs in
            await store.login('test@example.com', 'password123');
            expect(store.isAuthenticated).toBe(true);

            // Then: Redirect query param should still be available for component to use
            // (Component will handle navigation to intended route)
            expect(router.currentRoute.value.query.redirect).toBe('/notes');
        });
    });

    describe('Logout and route protection', () => {
        beforeEach(async () => {
            // Authenticate user first
            const store = authBootstrap.useStore();
            await store.login('test@example.com', 'password123');
            expect(store.isAuthenticated).toBe(true);
        });

        it('should not be able to access protected routes after logout', async () => {
            // Given: User is authenticated and on a protected route
            const store = authBootstrap.useStore();
            await router.push('/notes');
            expect(router.currentRoute.value.name).toBe('notes-list');

            // When: User logs out and tries to access protected route
            store.logout();
            expect(store.isAuthenticated).toBe(false);
            await navigateToRoute(router, '/notes');

            // Then: User should be redirected to login
            expect(router.currentRoute.value.name).toBe('login');
            expect(router.currentRoute.value.query.redirect).toBe('/notes');
        });

        it('should redirect to login when accessing home after logout', async () => {
            // Given: User is authenticated and on home
            const store = authBootstrap.useStore();
            await router.push('/');
            expect(router.currentRoute.value.name).toBe('home');

            // When: User logs out and tries to access home
            store.logout();
            expect(store.isAuthenticated).toBe(false);
            await navigateToRoute(router, '/');

            // Then: Should be redirected to login
            expect(router.currentRoute.value.name).toBe('login');
            expect(router.currentRoute.value.query.redirect).toBe('/');
        });

        it('should be able to access login page after logout', async () => {
            // Given: User is authenticated
            const store = authBootstrap.useStore();

            // When: User logs out and navigates to login
            store.logout();
            expect(store.isAuthenticated).toBe(false);
            await router.push('/login');

            // Then: Should be able to access login page
            expect(router.currentRoute.value.name).toBe('login');
        });
    });

    describe('Auth state initialization', () => {
        it('should initialize auth state on first navigation', async () => {
            // Given: User has not navigated yet, auth not initialized
            const store = authBootstrap.useStore();
            const initializeAuthSpy = vi.spyOn(store, 'initializeAuth');

            // When: User navigates to protected route
            await router.push('/notes');

            // Then: initializeAuth should have been called
            expect(initializeAuthSpy).toHaveBeenCalled();
        });

        it('should not re-initialize auth if already authenticated', async () => {
            // Given: User is already authenticated
            const store = authBootstrap.useStore();
            await store.login('test@example.com', 'password123');
            const initializeAuthSpy = vi.spyOn(store, 'initializeAuth');

            // When: User navigates to protected route
            await router.push('/notes');

            // Then: initializeAuth should not be called again
            expect(initializeAuthSpy).not.toHaveBeenCalled();
        });
    });
});

