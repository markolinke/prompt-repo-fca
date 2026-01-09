import { ValidationError } from '@/common/errors/DomainError';

/**
 * Login credentials entity.
 * Represents email and password for authentication.
 */
export class LoginCredentials {
    readonly email: string;
    readonly password: string;

    constructor(email: string, password: string) {
        this.email = email;
        this.password = password;
        this.validate();
    }

    /**
     * Validates login credentials according to domain rules.
     * @throws {ValidationError} if validation fails
     */
    private validate(): void {
        const errors: string[] = [];

        if (!this.email?.trim()) {
            errors.push('Email is required');
        } else if (!this.isValidEmail(this.email)) {
            errors.push('Email must be a valid email address');
        }

        if (!this.password || this.password.length === 0) {
            errors.push('Password is required');
        }

        if (errors.length > 0) {
            throw new ValidationError(`Validation failed: ${errors.join('; ')}`, errors);
        }
    }

    /**
     * Basic email validation.
     */
    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Converts credentials to plain object for API request.
     */
    toPlainObject(): { email: string; password: string } {
        return {
            email: this.email,
            password: this.password,
        };
    }
}

