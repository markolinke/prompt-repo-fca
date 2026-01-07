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

export class NoteNotFoundError extends DomainError {
    constructor(id: string) {
        super(`Note with id ${id} not found`);
        this.name = 'NoteNotFoundError';
    }
}

export class DuplicateNoteError extends DomainError {
    constructor(id: string) {
        super(`Note with id ${id} already exists`);
        this.name = 'DuplicateNoteError';
    }
}

export class HttpError extends DomainError {
    constructor(message: string) {
        super(message);
        this.name = 'HttpError';
    }
}

export class UnauthorizedError extends DomainError {
    constructor(message: string) {
        super(message);
        this.name = 'UnauthorizedError';
    }
}

export class NotFoundError extends DomainError {
    constructor(message: string) {
        super(message);
        this.name = 'NotFoundError';
    }
}

export class ForbiddenError extends DomainError {
    constructor(message: string) {
        super(message);
        this.name = 'ForbiddenError';
    }
}

export class InternalServerError extends DomainError {
    constructor(message: string) {
        super(message);
        this.name = 'InternalServerError';
    }
}