import { AuthRepositoryPort } from "./AuthRepositoryPort";
import { User } from "../entities/User";

// Mock repository
export class MockAuthRepository implements AuthRepositoryPort {

    async getCurrentUser(): Promise<User> {
        return new User('mock-user-1', 'test@example.com', 'Test User');
    }
}