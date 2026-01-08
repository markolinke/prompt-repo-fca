import { describe, it, expect } from 'vitest';
import { appDependencies } from '../AppDependencies';
import type { AppConfig } from '../AppDependencies';
import { BrowserTimeout } from '@/common/time/timeout/BrowserTimeout';
import { MyRouter } from '@/app/router/MyRouter';
import router from '@/app/router';

const _testAppConfig : AppConfig = {
    repositoryType: 'mock',
    baseUrl: 'https://api.example.com',
  };

const _testHttpClient = {
    get: async () => { return { data: 'test' }; },
    post: async () => { return { data: 'test' }; },
    put: async () => { return { data: 'test' }; },
    delete: async () => { return { data: 'test' }; },
    uploadFile: async () => { return { data: 'test' }; },
  };

describe('AppDependency registration tests', () => {
  it('should register and get the app config', () => {
    expect(() => appDependencies.getAppConfig()).toThrow('AppConfig has not been registered. Make sure to call registerAppConfig() during app initialization.');
    appDependencies.registerAppConfig(_testAppConfig);
    expect(appDependencies.getAppConfig()).toEqual(_testAppConfig);
  });

  it('should register and get the http client', () => {
      expect(() => appDependencies.getHttpClient()).toThrow('HttpClient has not been registered. Make sure to call registerHttpClient() during app initialization.');
      appDependencies.registerHttpClient(_testHttpClient);
      expect(appDependencies.getHttpClient()).toEqual(_testHttpClient);
  });

  it('should register and get the timeout client', () => {
    expect(() => appDependencies.getTimeoutClient()).toThrow('TimeoutClient has not been registered. Make sure to call registerTimeoutClient() during app initialization.');
    const timeoutClient = new BrowserTimeout();
    appDependencies.registerTimeoutClient(timeoutClient);
    expect(appDependencies.getTimeoutClient()).toEqual(timeoutClient);
  });

  it('should register and get the my router', () => {
    expect(() => appDependencies.getMyRouter()).toThrow('MyRouter has not been registered. Make sure to call registerMyRouter() during app initialization.');

    const myRouter = new MyRouter(router);
    appDependencies.registerMyRouter(myRouter);
    expect(appDependencies.getMyRouter()).toEqual(myRouter);
  });
});
