export declare class Prompt {
    readonly id: string;
    readonly title: string;
    readonly instructions: string;
    readonly template: string;
    readonly category: string | null;
    readonly tags: readonly string[];
    constructor(id: string, title: string, instructions: string, template: string, category: string | null, tags: string[]);
    /**
     * Creates a Prompt instance from a plain object (for deserialization).
     * @throws {ValidationError} if validation fails
     */
    static fromPlainObject(data: {
        id: string;
        title: string;
        instructions: string;
        template: string;
        category: string | null;
        tags: string[];
    }): Prompt;
    /**
     * Validates prompt properties according to domain rules.
     * @throws {ValidationError} if validation fails
     */
    private validate;
}
