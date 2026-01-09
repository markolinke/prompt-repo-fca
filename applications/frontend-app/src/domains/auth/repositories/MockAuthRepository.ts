import { AuthRepositoryPort } from "./AuthRepositoryPort";
import { User } from "../entities/User";
import { LoginCredentials } from "../entities/LoginCredentials";

// Mock repository
export class MockAuthRepository implements AuthRepositoryPort {

    async getCurrentUser(): Promise<User> {
        return new User('mock-user-1', 'test@example.com', 'Test User');
    }

    async login(credentials: LoginCredentials): Promise<{ access_token: string; refresh_token: string; token_type: string }> {
        // Basic validation to match real behavior
        if (!credentials.email || !credentials.password) {
            throw new Error('Invalid credentials');
        }
        
        return {
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token',
            token_type: 'bearer',
        };
    }

    async refreshToken(refreshToken: string): Promise<{ access_token: string; refresh_token: string; token_type: string }> {
        // Basic validation
        if (!refreshToken || refreshToken === 'invalid-refresh-token') {
            throw new Error('Invalid refresh token');
        }
        
        return {
            access_token: 'mock-access-token-refreshed',
            refresh_token: 'mock-refresh-token-refreshed',
            token_type: 'bearer',
        };
    }
}