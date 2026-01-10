import type { AuthRepositoryPort } from "../repositories/AuthRepositoryPort";
import { User } from "../entities/User";
import { LoginCredentials } from "../entities/LoginCredentials";

export class AuthService {
    constructor(private readonly repository: AuthRepositoryPort) {}

    async getCurrentUser(): Promise<User> {
        return this.repository.getCurrentUser();
    }

    async login(email: string, password: string): Promise<{ accessToken: string }> {
        // Create credentials entity (validation happens here)
        const credentials = new LoginCredentials(email, password);
        
        // Call repository
        const response = await this.repository.login(credentials);
        
        // Transform response from snake_case to camelCase
        return {
            accessToken: response.access_token,
        };
    }
}
