export class DomainError extends Error {
    constructor(message) {
        super(message);
        this.name = 'DomainError';
    }
}
export class ValidationError extends DomainError {
    field;
    constructor(message, field) {
        super(message);
        this.field = field;
        this.name = 'ValidationError';
    }
}
export class PromptNotFoundError extends DomainError {
    constructor(id) {
        super(`Prompt with id ${id} not found`);
        this.name = 'PromptNotFoundError';
    }
}
export class DuplicatePromptError extends DomainError {
    constructor(id) {
        super(`Prompt with id ${id} already exists`);
        this.name = 'DuplicatePromptError';
    }
}
