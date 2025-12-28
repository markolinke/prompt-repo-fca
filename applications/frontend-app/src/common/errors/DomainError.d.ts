export declare class DomainError extends Error {
    constructor(message: string);
}
export declare class ValidationError extends DomainError {
    readonly field?: string | undefined;
    constructor(message: string, field?: string | undefined);
}
export declare class PromptNotFoundError extends DomainError {
    constructor(id: string);
}
export declare class DuplicatePromptError extends DomainError {
    constructor(id: string);
}
