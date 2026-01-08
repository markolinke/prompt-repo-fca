import { User } from "../entities/User";

export interface AuthRepositoryPort {
    getCurrentUser(): Promise<User>;
    // Phase 3: login(), logout() will be added here
}

