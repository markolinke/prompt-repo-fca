export interface HttpClientPort {
    get(endpoint: string, params?: any, signal?: AbortSignal): Promise<any>;
    post(endpoint: string, data?: any, signal?: AbortSignal): Promise<any>;
    put(endpoint: string, data?: any, signal?: AbortSignal): Promise<any>;
    delete(endpoint: string, data?: any): Promise<any>;
    uploadFile(endpoint: string, formData: FormData): Promise<any>;
}
