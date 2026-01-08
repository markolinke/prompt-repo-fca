import type { AuthRepositoryPort } from "../repositories/AuthRepositoryPort";
import { User } from "../entities/User";

export class AuthService {
    constructor(private readonly repository: AuthRepositoryPort) {}

    async getCurrentUser(): Promise<User> {
        return this.repository.getCurrentUser();
    }

    // Phase 3: login(), logout() will be added here
}

