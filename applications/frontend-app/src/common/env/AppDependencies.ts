import type { MyRouterPort } from "@/common/routing/MyRouterPort";
import type { HttpClientPort } from "@/common/http/HttpClientPort";
import type { TimeoutPort } from "@/common/time/timeout/TimeoutPort";

export interface AppConfig {
    baseUrl: string;
    repositoryType: 'mock' | 'http';
}

class AppDependencies {
    private myRouter: MyRouterPort | null = null
    private httpClient: HttpClientPort | null = null
    private authenticatedHttpClient: HttpClientPort | null = null
    private timeoutClient: TimeoutPort | null = null
    private appConfig: AppConfig | null = null

    registerAppConfig(appConfig: AppConfig): void {
        this.appConfig = appConfig
    }

    getAppConfig(): AppConfig {
        if (!this.appConfig) {
            throw new Error('AppConfig has not been registered. Make sure to call registerAppConfig() during app initialization.')
        }
        return this.appConfig
    }

    registerHttpClient(httpClient: HttpClientPort): void {
        this.httpClient = httpClient
    }

    getHttpClient(): HttpClientPort {
        if (!this.httpClient) {
            throw new Error('HttpClient has not been registered. Make sure to call registerHttpClient() during app initialization.')
        }
        return this.httpClient
    }

    registerTimeoutClient(timeoutClient: TimeoutPort): void {
        this.timeoutClient = timeoutClient
    }

    getTimeoutClient(): TimeoutPort {
        if (!this.timeoutClient) {
            throw new Error('TimeoutClient has not been registered. Make sure to call registerTimeoutClient() during app initialization.')
        }
        return this.timeoutClient
    }

    registerMyRouter(router: MyRouterPort): void {
        this.myRouter = router
    }

    getMyRouter(): MyRouterPort {
        if (!this.myRouter) {
            throw new Error('MyRouter has not been registered. Make sure to call registerMyRouter() during app initialization.')
        }
        return this.myRouter
    }

    registerAuthenticatedHttpClient(httpClient: HttpClientPort): void {
        this.authenticatedHttpClient = httpClient
    }

    getAuthenticatedHttpClient(): HttpClientPort {
        const appConfig = this.getAppConfig()
        
        // In mock mode, return base client (no auth needed)
        if (appConfig.repositoryType === 'mock') {
            return this.getHttpClient()
        }
        
        // In http mode, require authenticated client to be registered
        if (!this.authenticatedHttpClient) {
            throw new Error('AuthenticatedHttpClient has not been registered. Make sure auth domain boots first.')
        }
        
        return this.authenticatedHttpClient
    }

    /**
     * Resets all registered dependencies (ONLY for testing). 
     */
    resetForTesting(): void {
        this.myRouter = null;
        this.httpClient = null;
        this.authenticatedHttpClient = null;
        this.timeoutClient = null;
        this.appConfig = null;
    }
}

export const appDependencies = new AppDependencies()
