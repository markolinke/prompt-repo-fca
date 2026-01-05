export interface AppConfig {
    isMockEnv: boolean;
    baseUrl: string;
}

export const appConfig: AppConfig = {
    isMockEnv: import.meta.env.VITE_ENV === 'mock' || import.meta.env.MODE === 'test',
    baseUrl: import.meta.env.VITE_API_URL,
}
