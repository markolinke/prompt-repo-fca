import { vi } from 'vitest';
import { AuthService } from '../services/AuthService';
import { TokenService } from '../services/TokenService';
import { createAuthStore } from '../store/AuthStore';
import { MockTokenRepository } from '../repositories/MockTokenRepository';
import { User } from '../entities/User';
import { appDependencies } from '@/common/env/AppDependencies';
import type { MyRouterPort } from '@/common/routing/MyRouterPort';

export const mockBootstrapAuth = () => {
  vi.mock('../bootstrap', () => {
    return {
      bootstrapAuth: () => {
        const mockRepository = {
          async getCurrentUser() {
            return new User('mock-user-1', 'test@example.com', 'Test User');
          },
          async login() {
            return {
              access_token: 'mock-access-token',
              refresh_token: 'mock-refresh-token',
              token_type: 'bearer',
            };
          },
        };
        const service = new AuthService(mockRepository);
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

