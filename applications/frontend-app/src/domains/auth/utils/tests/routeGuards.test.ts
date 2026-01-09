import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { RouteLocationNormalized, NavigationGuardNext } from 'vue-router';
import { createAuthGuard, type AuthStoreShape } from '../routeGuards';

describe('createAuthGuard', () => {
    let mockAuthStore: AuthStoreShape;
    let mockNext: NavigationGuardNext;
    let mockTo: RouteLocationNormalized;
    let mockFrom: RouteLocationNormalized;

    beforeEach(() => {
        mockNext = vi.fn();
        mockFrom = {
            path: '/previous',
            name: 'previous',
            matched: [],
            params: {},
            query: {},
            hash: '',
            fullPath: '/previous',
            redirectedFrom: undefined,
            meta: {},
        } as RouteLocationNormalized;

        mockTo = {
            path: '/notes',
            name: 'notes-list',
            matched: [],
            params: {},
            query: {},
            hash: '',
            fullPath: '/notes',
            redirectedFrom: undefined,
            meta: {},
        } as RouteLocationNormalized;
    });

    describe('Public routes', () => {
        it('should allow access to public routes without authentication', () => {
            // Given: Route is marked as public
            mockTo.matched = [{ meta: { isPublic: true } }] as any;
            mockAuthStore = {
                isAuthenticated: false,
                loading: false,
                initializeAuth: vi.fn(),
            };

            // When: Guard is executed
            const guard = createAuthGuard(() => mockAuthStore, 'login');
            guard(mockTo, mockFrom, mockNext);

            // Then: Navigation should be allowed
            expect(mockNext).toHaveBeenCalledWith();
            expect(mockNext).toHaveBeenCalledTimes(1);
            expect(mockAuthStore.initializeAuth).not.toHaveBeenCalled();
        });

        it('should allow access to public routes even if user is authenticated', () => {
            // Given: Route is public and user is authenticated
            mockTo.matched = [{ meta: { isPublic: true } }] as any;
            mockAuthStore = {
                isAuthenticated: true,
                loading: false,
                initializeAuth: vi.fn(),
            };

            // When: Guard is executed
            const guard = createAuthGuard(() => mockAuthStore, 'login');
            guard(mockTo, mockFrom, mockNext);

            // Then: Navigation should be allowed
            expect(mockNext).toHaveBeenCalledWith();
            expect(mockNext).toHaveBeenCalledTimes(1);
        });
    });

    describe('Protected routes', () => {
        it('should redirect to login when user is not authenticated', () => {
            // Given: Route is protected (no meta.isPublic) and user is not authenticated
            mockTo.matched = [{ meta: {} }] as any;
            mockAuthStore = {
                isAuthenticated: false,
                loading: false,
                initializeAuth: vi.fn(),
            };

            // When: Guard is executed
            const guard = createAuthGuard(() => mockAuthStore, 'login');
            guard(mockTo, mockFrom, mockNext);

            // Then: Should redirect to login with redirect query param
            expect(mockNext).toHaveBeenCalledWith({
                name: 'login',
                query: { redirect: '/notes' },
            });
            expect(mockAuthStore.initializeAuth).toHaveBeenCalled();
        });

        it('should allow access to protected routes when user is authenticated', () => {
            // Given: Route is protected and user is authenticated
            mockTo.matched = [{ meta: {} }] as any;
            mockAuthStore = {
                isAuthenticated: true,
                loading: false,
                initializeAuth: vi.fn(),
            };

            // When: Guard is executed
            const guard = createAuthGuard(() => mockAuthStore, 'login');
            guard(mockTo, mockFrom, mockNext);

            // Then: Navigation should be allowed
            expect(mockNext).toHaveBeenCalledWith();
            expect(mockNext).toHaveBeenCalledTimes(1);
            expect(mockAuthStore.initializeAuth).not.toHaveBeenCalled();
        });

        it('should use custom login route name when provided', () => {
            // Given: Route is protected and custom login route name is provided
            mockTo.matched = [{ meta: {} }] as any;
            mockAuthStore = {
                isAuthenticated: false,
                loading: false,
                initializeAuth: vi.fn(),
            };

            // When: Guard is executed with custom login route name
            const guard = createAuthGuard(() => mockAuthStore, 'sign-in');
            guard(mockTo, mockFrom, mockNext);

            // Then: Should redirect to custom login route
            expect(mockNext).toHaveBeenCalledWith({
                name: 'sign-in',
                query: { redirect: '/notes' },
            });
        });

        it('should include full path in redirect query parameter', () => {
            // Given: Route with query parameters
            mockTo.fullPath = '/notes?filter=active&sort=date';
            mockTo.matched = [{ meta: {} }] as any;
            mockAuthStore = {
                isAuthenticated: false,
                loading: false,
                initializeAuth: vi.fn(),
            };

            // When: Guard is executed
            const guard = createAuthGuard(() => mockAuthStore, 'login');
            guard(mockTo, mockFrom, mockNext);

            // Then: Should include full path with query params in redirect
            expect(mockNext).toHaveBeenCalledWith({
                name: 'login',
                query: { redirect: '/notes?filter=active&sort=date' },
            });
        });
    });

    describe('Auth initialization', () => {
        it('should initialize auth state if user is not authenticated and not loading', () => {
            // Given: Protected route, user not authenticated, not loading
            mockTo.matched = [{ meta: {} }] as any;
            mockAuthStore = {
                isAuthenticated: false,
                loading: false,
                initializeAuth: vi.fn(),
            };

            // When: Guard is executed
            const guard = createAuthGuard(() => mockAuthStore, 'login');
            guard(mockTo, mockFrom, mockNext);

            // Then: Should call initializeAuth
            expect(mockAuthStore.initializeAuth).toHaveBeenCalled();
        });

        it('should not initialize auth if user is already authenticated', () => {
            // Given: Protected route, user is authenticated
            mockTo.matched = [{ meta: {} }] as any;
            mockAuthStore = {
                isAuthenticated: true,
                loading: false,
                initializeAuth: vi.fn(),
            };

            // When: Guard is executed
            const guard = createAuthGuard(() => mockAuthStore, 'login');
            guard(mockTo, mockFrom, mockNext);

            // Then: Should not call initializeAuth
            expect(mockAuthStore.initializeAuth).not.toHaveBeenCalled();
        });

        it('should not initialize auth if already loading', () => {
            // Given: Protected route, user not authenticated but loading
            mockTo.matched = [{ meta: {} }] as any;
            mockAuthStore = {
                isAuthenticated: false,
                loading: true,
                initializeAuth: vi.fn(),
            };

            // When: Guard is executed
            const guard = createAuthGuard(() => mockAuthStore, 'login');
            guard(mockTo, mockFrom, mockNext);

            // Then: Should not call initializeAuth (already in progress)
            expect(mockAuthStore.initializeAuth).not.toHaveBeenCalled();
        });
    });

    describe('Route matching logic', () => {
        it('should check all matched routes for isPublic meta', () => {
            // Given: Route with multiple matched records, one marked as public
            mockTo.matched = [
                { meta: {} },
                { meta: { isPublic: true } },
            ] as any;
            mockAuthStore = {
                isAuthenticated: false,
                loading: false,
                initializeAuth: vi.fn(),
            };

            // When: Guard is executed
            const guard = createAuthGuard(() => mockAuthStore, 'login');
            guard(mockTo, mockFrom, mockNext);

            // Then: Should allow access (route is public)
            expect(mockNext).toHaveBeenCalledWith();
        });

        it('should treat route as protected if isPublic is false', () => {
            // Given: Route explicitly marked as not public
            mockTo.matched = [{ meta: { isPublic: false } }] as any;
            mockAuthStore = {
                isAuthenticated: false,
                loading: false,
                initializeAuth: vi.fn(),
            };

            // When: Guard is executed
            const guard = createAuthGuard(() => mockAuthStore, 'login');
            guard(mockTo, mockFrom, mockNext);

            // Then: Should redirect to login (route is protected)
            expect(mockNext).toHaveBeenCalledWith({
                name: 'login',
                query: { redirect: '/notes' },
            });
        });
    });
});

