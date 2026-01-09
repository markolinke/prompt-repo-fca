import { describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from '../services/AuthService';
import { User } from '../entities/User';
import { MockAuthRepository } from '../repositories/MockAuthRepository';
import { ValidationError } from '@/common/errors/DomainError';

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
            expect(user.email).toBe('mock@ancorit.com');
            expect(user.name).toBe('Test User');
        });
    });

    describe('login', () => {
        it('should login successfully and return tokens', async () => {
            const result = await service.login('mock@ancorit.com', 'LetMeIn!');
            
            expect(result).toHaveProperty('accessToken');
            expect(result).toHaveProperty('refreshToken');
            expect(result.accessToken).toBe('mock-access-token');
            expect(result.refreshToken).toBe('mock-refresh-token');
        });

        it('should throw ValidationError for invalid email', async () => {
            await expect(service.login('invalid-email', 'LetMeIn!')).rejects.toThrow(ValidationError);
        });

        it('should throw ValidationError for empty password', async () => {
            await expect(service.login('mock@ancorit.com', '')).rejects.toThrow(ValidationError);
        });

        it('should propagate repository errors', async () => {
            await expect(service.login('mock@ancorit.com', 'wrong')).rejects.toThrow('Invalid credentials');
        });
    });
});