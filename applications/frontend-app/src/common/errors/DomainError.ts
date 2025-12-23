export class DomainError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DomainError';
    }
}

export class ValidationError extends DomainError {
    constructor(message: string, public readonly field?: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

export class PromptNotFoundError extends DomainError {
    constructor(id: string) {
        super(`Prompt with id ${id} not found`);
        this.name = 'PromptNotFoundError';
    }
}

export class DuplicatePromptError extends DomainError {
    constructor(id: string) {
        super(`Prompt with id ${id} already exists`);
        this.name = 'DuplicatePromptError';
    }
}

