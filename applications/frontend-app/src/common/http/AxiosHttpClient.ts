import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import { HttpError, UnauthorizedError, NotFoundError, ForbiddenError, InternalServerError } from "@/common/errors/DomainError";
import type { MyRouterPort } from "@/common/routing/MyRouterPort";
import type { HttpClientPort } from "./HttpClientPort";

export class AxiosHttpClient implements HttpClientPort {

    constructor(
        private readonly baseUrl: string,
        private readonly headers: Record<string, string> = {},
        private readonly router: MyRouterPort,
        private readonly getToken?: () => string | null
    ) { }

    public async get(endpoint: string = "", params?: any, signal?: AbortSignal): Promise<any> {
        try {
            const client = this.createClient(params);
            const response = await client.get(endpoint, { signal });
            return response.data;
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async post(endpoint: string = "", data?: any, signal?: AbortSignal): Promise<any> {
        try {
            const client = this.createClient();
            const response = await client.post(endpoint, data, { signal });
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    public async put(endpoint: string = "", data?: any, signal?: AbortSignal): Promise<any> {
        try {
            const client = this.createClient();
            const response = await client.put(endpoint, data, { signal });
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    public async delete(endpoint: string = "", data?: any): Promise<any> {
        try {
            const client = this.createClient();
            const response = await client.delete(endpoint, data);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    public async uploadFile(endpoint: string = "", formData: FormData): Promise<any> {
        try {
            const client = this.createClient();
            const response = await client.post(endpoint, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                }
            });
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    private createClient(params: object = {}): AxiosInstance {
        const config: AxiosRequestConfig = {
            baseURL: this.baseUrl,
            headers: this.headers,
            params: params
        };
        const token = this.getToken?.(); // Dynamic token retrieval at request time
        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }
        return axios.create(config);
    }

    private navigateToError(error: Error): void {
        this.router.navigateTo({ name: 'Error', params: { error } });
      }
    
    private handleError(error: any): never {
    
        if (error.response) {
            const status = error.response.status;

            switch (status) {
            case 401:
                this.navigateToError(new UnauthorizedError(error.response.data));
                throw new UnauthorizedError(error.response.data);
            case 403:
                this.navigateToError(new ForbiddenError(error.response.data));
                throw new ForbiddenError(error.response.data);
            case 404:
                this.navigateToError(new NotFoundError(error.response.data));
                throw new NotFoundError(error.response.data);
            case 500:
                this.navigateToError(new InternalServerError(error.response.data));
                throw new InternalServerError(error.response.data);
            default:
                this.navigateToError(new HttpError(error.message));
                throw new HttpError(error.message);
            }
        } else {
            this.navigateToError(new HttpError(error.message));
            throw new HttpError(error.message);
        }
    }
}
