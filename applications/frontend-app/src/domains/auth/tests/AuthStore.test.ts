import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { createAuthStore } from '../store/AuthStore';
import { User } from '../entities/User';

describe('AuthStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('should initialize with empty state', () => {
        const mockService = {
            async getCurrentUser() {
                return new User('test-1', 'test@test.com', 'Test User');
            }
        };
        
        const useStore = createAuthStore(mockService);
        const store = useStore();
        
        expect(store.user).toBeNull();
        expect(store.token).toBeNull();
        expect(store.isAuthenticated).toBe(false);
        expect(store.loading).toBe(false);
        expect(store.error).toBeNull();
    });

    it('should fetch current user and update state', async () => {
        const mockService = {
            async getCurrentUser() {
                return new User('test-1', 'test@test.com', 'Test User');
            }
        };
        
        const useStore = createAuthStore(mockService);
        const store = useStore();
        
        await store.fetchCurrentUser();
        
        expect(store.user).not.toBeNull();
        expect(store.user?.id).toBe('test-1');
        expect(store.isAuthenticated).toBe(true);
        expect(store.token).toBe('mock-token');
        expect(store.loading).toBe(false);
    });

    it('should handle logout', async () => {
        const mockService = {
            async getCurrentUser() {
                return new User('test-1', 'test@test.com', 'Test User');
            }
        };
        
        const useStore = createAuthStore(mockService);
        const store = useStore();
        
        await store.fetchCurrentUser();
        expect(store.isAuthenticated).toBe(true);
        
        store.logout();
        
        expect(store.user).toBeNull();
        expect(store.token).toBeNull();
        expect(store.isAuthenticated).toBe(false);
    });

    it('should provide token getter function', async () => {
        const mockService = {
            async getCurrentUser() {
                return new User('test-1', 'test@test.com', 'Test User');
            }
        };
        
        const useStore = createAuthStore(mockService);
        const store = useStore();
        
        await store.fetchCurrentUser();
        
        const getToken = store.getToken;
        expect(typeof getToken).toBe('function');
        expect(getToken()).toBe('mock-token');
    });
});