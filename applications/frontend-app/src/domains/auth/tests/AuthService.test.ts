import { describe, it, expect, beforeEach, vi } from 'vitest';
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
            expect(user.email).toBe('test@example.com');
            expect(user.name).toBe('Test User');
        });
    });

    describe('login', () => {
        it('should login successfully and return tokens', async () => {
            const result = await service.login('test@example.com', 'password123');
            
            expect(result).toHaveProperty('accessToken');
            expect(result).toHaveProperty('refreshToken');
            expect(result.accessToken).toBe('mock-access-token');
            expect(result.refreshToken).toBe('mock-refresh-token');
        });

        it('should throw ValidationError for invalid email', async () => {
            await expect(service.login('invalid-email', 'password123')).rejects.toThrow(ValidationError);
        });

        it('should throw ValidationError for empty password', async () => {
            await expect(service.login('test@example.com', '')).rejects.toThrow(ValidationError);
        });

        it('should propagate repository errors', async () => {
            const mockRepo = {
                getCurrentUser: vi.fn(),
                login: vi.fn().mockRejectedValue(new Error('Invalid credentials')),
            };
            const serviceWithMock = new AuthService(mockRepo);
            
            await expect(serviceWithMock.login('test@example.com', 'wrong')).rejects.toThrow('Invalid credentials');
        });
    });
});