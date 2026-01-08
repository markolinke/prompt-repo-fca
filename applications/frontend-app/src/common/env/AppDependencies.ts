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

    /**
     * Resets all registered dependencies (ONLY for testing). 
     */
    resetForTesting(): void {
        this.myRouter = null;
        this.httpClient = null;
        this.timeoutClient = null;
        this.appConfig = null;
    }
}

export const appDependencies = new AppDependencies()
