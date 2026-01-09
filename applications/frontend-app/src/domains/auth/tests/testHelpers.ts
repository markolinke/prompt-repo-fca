import { vi } from 'vitest';
import type { Router } from 'vue-router';
import { AuthService } from '../services/AuthService';
import { TokenService } from '../services/TokenService';
import { createAuthStore } from '../store/AuthStore';
import { MockTokenRepository } from '../repositories/MockTokenRepository';
import { MockAuthRepository } from '../repositories/MockAuthRepository';
import { appDependencies } from '@/common/env/AppDependencies';
import type { MyRouterPort } from '@/common/routing/MyRouterPort';

export const mockBootstrapAuth = () => {
  vi.mock('../bootstrap', () => {
    return {
      bootstrapAuth: () => {
        // Real service with mock repository (following guidelines)
        const repository = new MockAuthRepository();
        const service = new AuthService(repository);
        const tokenRepository = new MockTokenRepository();
        const tokenService = new TokenService(tokenRepository);
        const useStore = createAuthStore(service, tokenService); 

        return {
          useStore,
          routes: [],
          initializeAuth: () => {
            const store = useStore();
            store.initializeAuth();
          },
        };
      },
    };
  });
};

/**
 * Sets up mock AppDependencies for testing.
 * Registers a mock MyRouter that doesn't actually navigate.
 * Call this function at the top level, then use beforeEach to call setupMockAppDependencies.
 */
export const setupMockAppDependencies = () => {
  appDependencies.resetForTesting();
  
  const mockMyRouter: MyRouterPort = {
    navigateTo: vi.fn(),
    navigateToError: vi.fn(),
  };
  
  appDependencies.registerMyRouter(mockMyRouter);
  
  // Register minimal required dependencies
  appDependencies.registerAppConfig({
    baseUrl: 'http://localhost:8000',
    repositoryType: 'mock',
  });
};

/**
 * Navigates to a route, ensuring route guards run even if already on the target route.
 * This is useful when auth state has changed and you need to test route protection.
 * 
 * If already on the target route, navigates to /login first to trigger guards,
 * then navigates to the target route.
 */
export const navigateToRoute = async (router: Router, path: string): Promise<void> => {
    // Wait for any pending state changes to propagate
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // If already on this route, navigate away first to ensure guards run
    if (router.currentRoute.value.path === path) {
        await router.push('/login');
    }
    
    await router.push(path);
};

