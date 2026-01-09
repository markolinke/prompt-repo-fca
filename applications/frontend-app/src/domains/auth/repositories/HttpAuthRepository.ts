import type { HttpClientPort } from "@/common/http/HttpClientPort";
import type { AuthRepositoryPort } from "./AuthRepositoryPort";
import { User } from "../entities/User";
import { LoginCredentials } from "../entities/LoginCredentials";

export class HttpAuthRepository implements AuthRepositoryPort {
    constructor(private readonly httpClient: HttpClientPort) {}

    async getCurrentUser(): Promise<User> {
        const data = await this.httpClient.get('/auth/me');
        return User.fromPlainObject(data);
    }

    async login(credentials: LoginCredentials): Promise<{ access_token: string; refresh_token: string; token_type: string }> {
        const response = await this.httpClient.post('/auth/login', credentials.toPlainObject());
        return {
            access_token: response.access_token,
            refresh_token: response.refresh_token,
            token_type: response.token_type || 'bearer',
        };
    }
}

