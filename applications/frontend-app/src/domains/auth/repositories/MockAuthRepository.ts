import { AuthRepositoryPort } from "./AuthRepositoryPort";
import { User } from "../entities/User";
import { LoginCredentials } from "../entities/LoginCredentials";
import { UnauthorizedError, ValidationError } from "@/common/errors/DomainError";

// Mock repository
export class MockAuthRepository implements AuthRepositoryPort {

    async getCurrentUser(): Promise<User> {
        return new User('mock-user-1', 'mock@ancorit.com', 'Test User');
    }

    async login(credentials: LoginCredentials): Promise<{ access_token: string; token_type: string }> {
        // Basic validation to match real behavior
        if (!credentials.email || !credentials.password) {
            throw new ValidationError('Invalid credentials', ['Email and password are required']);
        }

        if (credentials.email !== 'mock@ancorit.com' || credentials.password !== 'LetMeIn!') {
            throw new UnauthorizedError('Invalid credentials');
        }

        return {
            access_token: 'mock-access-token',
            token_type: 'bearer',
        };
    }
}