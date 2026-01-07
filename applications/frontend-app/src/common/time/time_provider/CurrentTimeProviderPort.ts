export interface CurrentTimeProviderPort { 
    getCurrentTime(): Date;
    getTimezone(): string;
}