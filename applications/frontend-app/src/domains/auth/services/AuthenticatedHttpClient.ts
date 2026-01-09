import type { HttpClientPort } from "@/common/http/HttpClientPort";
import { UnauthorizedError } from "@/common/errors/DomainError";
import type { AxiosHttpClient } from "@/common/http/AxiosHttpClient";

/**
 * Type for refresh token callback function.
 * Returns true if refresh succeeded, false otherwise.
 */
export type RefreshTokenCallback = () => Promise<boolean>;

/**
 * Wrapper around AxiosHttpClient that automatically handles 401 errors
 * by attempting token refresh before retrying the request.
 * 
 * Implements HttpClientPort to be a drop-in replacement.
 */
export class AuthenticatedHttpClient implements HttpClientPort {
    private refreshInProgress: Promise<boolean> | null = null;

    constructor(
        private readonly baseClient: AxiosHttpClient,
        private readonly refreshCallback: RefreshTokenCallback
    ) {}

    async get(endpoint: string = "", params?: any, signal?: AbortSignal): Promise<any> {
        return this.executeWithRefresh(() => 
            this.baseClient.get(endpoint, params, signal)
        );
    }

    async post(endpoint: string = "", data?: any, signal?: AbortSignal): Promise<any> {
        return this.executeWithRefresh(() => 
            this.baseClient.post(endpoint, data, signal)
        );
    }

    async put(endpoint: string = "", data?: any, signal?: AbortSignal): Promise<any> {
        return this.executeWithRefresh(() => 
            this.baseClient.put(endpoint, data, signal)
        );
    }

    async delete(endpoint: string = "", data?: any): Promise<any> {
        return this.executeWithRefresh(() => 
            this.baseClient.delete(endpoint, data)
        );
    }

    async uploadFile(endpoint: string = "", formData: FormData): Promise<any> {
        return this.executeWithRefresh(() => 
            this.baseClient.uploadFile(endpoint, formData)
        );
    }

    /**
     * Execute request with automatic refresh on 401.
     * Prevents concurrent refresh attempts.
     */
    private async executeWithRefresh<T>(request: () => Promise<T>): Promise<T> {
        try {
            return await request();
        } catch (error) {
            // Only handle 401 Unauthorized errors
            if (!(error instanceof UnauthorizedError)) {
                throw error;
            }

            // Attempt refresh (with concurrency protection)
            const refreshed = await this.attemptRefresh();
            
            if (refreshed) {
                // Retry original request once
                return await request();
            }
            
            // Refresh failed, throw original error
            throw error;
        }
    }

    /**
     * Attempt token refresh with concurrency protection.
     * If refresh is already in progress, wait for it instead of starting new one.
     */
    private async attemptRefresh(): Promise<boolean> {
        // If refresh already in progress, wait for it
        if (this.refreshInProgress) {
            return await this.refreshInProgress;
        }

        // Start new refresh
        this.refreshInProgress = this.refreshCallback()
            .finally(() => {
                // Clear flag when done
                this.refreshInProgress = null;
            });

        return await this.refreshInProgress;
    }
}

