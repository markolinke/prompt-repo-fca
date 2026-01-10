import { User } from "../entities/User";
import { LoginCredentials } from "../entities/LoginCredentials";

export interface AuthRepositoryPort {
    getCurrentUser(): Promise<User>;
    login(credentials: LoginCredentials): Promise<{ access_token: string; token_type: string }>;
}

