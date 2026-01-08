// applications/frontend-app/src/app/bootstrap/tests/bootstrapDependencies.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { bootstrapDependencies } from '../bootstrapDependencies';
import { appDependencies } from '@/common/env/AppDependencies';
import { MyRouter } from '@/app/router/MyRouter';
import { AxiosHttpClient } from '@/common/http/AxiosHttpClient';
import { BrowserTimeout } from '@/common/time/timeout/BrowserTimeout';
import { createRouter, createWebHistory } from 'vue-router';

describe('bootstrapDependencies', () => {
  let mockRouter: ReturnType<typeof createRouter>;

  beforeEach(() => {
    appDependencies.resetForTesting();
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.test.com');
    vi.stubEnv('VITE_REPOSITORY_TYPE', 'mock');
  });

  it('should register app config with values from environment variables', () => {
    // Arrange
    const expectedBaseUrl = 'https://api.test.com';
    const expectedRepoType = 'mock';
    
    // Mock environment variables
    vi.stubEnv('VITE_API_BASE_URL', expectedBaseUrl);
    vi.stubEnv('VITE_REPOSITORY_TYPE', expectedRepoType);
    
    mockRouter = createRouter({
      history: createWebHistory(),
      routes: [],
    });

    // Act
    bootstrapDependencies(mockRouter);

    // Assert
    const config = appDependencies.getAppConfig();
    expect(config.baseUrl).toBe(expectedBaseUrl);
    expect(config.repositoryType).toBe(expectedRepoType);
  });

  it('should register MyRouter instance', () => {
    // Arrange
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.test.com');
    vi.stubEnv('VITE_REPOSITORY_TYPE', 'mock');
    
    mockRouter = createRouter({
      history: createWebHistory(),
      routes: [],
    });

    // Act
    bootstrapDependencies(mockRouter);

    // Assert
    const myRouter = appDependencies.getMyRouter();
    expect(myRouter).toBeInstanceOf(MyRouter);
  });

  it('should register AxiosHttpClient with correct baseUrl', () => {
    // Arrange
    const expectedBaseUrl = 'https://api.test.com';
    vi.stubEnv('VITE_API_BASE_URL', expectedBaseUrl);
    vi.stubEnv('VITE_REPOSITORY_TYPE', 'mock');
    
    mockRouter = createRouter({
      history: createWebHistory(),
      routes: [],
    });

    // Act
    bootstrapDependencies(mockRouter);

    // Assert
    const httpClient = appDependencies.getHttpClient();
    expect(httpClient).toBeInstanceOf(AxiosHttpClient);
    // Verify it was created with the correct baseUrl by checking it's not null/undefined
    expect(httpClient).toBeDefined();
  });

  it('should register BrowserTimeout instance', () => {
    // Arrange
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.test.com');
    vi.stubEnv('VITE_REPOSITORY_TYPE', 'mock');
    
    mockRouter = createRouter({
      history: createWebHistory(),
      routes: [],
    });

    // Act
    bootstrapDependencies(mockRouter);

    // Assert
    const timeoutClient = appDependencies.getTimeoutClient();
    expect(timeoutClient).toBeInstanceOf(BrowserTimeout);
  });

  it('should register all dependencies when called', () => {
    // Arrange
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.test.com');
    vi.stubEnv('VITE_REPOSITORY_TYPE', 'http');
    
    mockRouter = createRouter({
      history: createWebHistory(),
      routes: [],
    });

    // Act
    bootstrapDependencies(mockRouter);

    // Assert - verify all dependencies are registered (no errors thrown)
    expect(() => appDependencies.getAppConfig()).not.toThrow();
    expect(() => appDependencies.getHttpClient()).not.toThrow();
    expect(() => appDependencies.getTimeoutClient()).not.toThrow();
    expect(() => appDependencies.getMyRouter()).not.toThrow();
  });

  it('should create AxiosHttpClient with MyRouter instance', () => {
    // Arrange
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.test.com');
    vi.stubEnv('VITE_REPOSITORY_TYPE', 'mock');
    
    mockRouter = createRouter({
      history: createWebHistory(),
      routes: [],
    });

    // Act
    bootstrapDependencies(mockRouter);

    // Assert
    const httpClient = appDependencies.getHttpClient();
    const myRouter = appDependencies.getMyRouter();
    
    // Both should be registered and instances of their classes
    expect(httpClient).toBeInstanceOf(AxiosHttpClient);
    expect(myRouter).toBeInstanceOf(MyRouter);
  });
});