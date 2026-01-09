import { describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from '../services/AuthService';
import { User } from '../entities/User';
import { MockAuthRepository } from '../repositories/MockAuthRepository';

describe('AuthService', () => {
    let service: AuthService;
    let repository: MockAuthRepository;

    beforeEach(() => {
        repository = new MockAuthRepository();
        service = new AuthService(repository);
    });

    describe('getCurrentUser', () => {
        it('should return user from repository', async () => {
            const user = await service.getCurrentUser();
            
            expect(user).toBeInstanceOf(User);
            expect(user.id).toBe('mock-user-1');
            expect(user.email).toBe('test@example.com');
            expect(user.name).toBe('Test User');
        });
    });
});