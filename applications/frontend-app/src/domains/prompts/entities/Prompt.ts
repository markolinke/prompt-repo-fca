import { ValidationError } from '../../../common/errors/DomainError';

export class Prompt {
    readonly id: string;
    readonly title: string;
    readonly instructions: string;
    readonly template: string;
    readonly category: string | null;
    readonly tags: readonly string[];

    constructor(
        id: string,
        title: string,
        instructions: string,
        template: string,
        category: string | null,
        tags: string[]
    ) {        
        this.id = id;
        this.title = title;
        this.instructions = instructions;
        this.template = template;
        this.category = category;
        this.tags = Object.freeze([...tags]) as readonly string[];
    }

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
    }): Prompt {
        return new Prompt(
            data.id,
            data.title,
            data.instructions,
            data.template,
            data.category,
            data.tags
        );
    }

    /**
     * Validates prompt properties according to domain rules.
     * @throws {ValidationError} if validation fails
     */
    public validate(
    ): void {
        const errors: string[] = [];

        if (!this.id?.trim()) errors.push('ID is required');
        if (!this.title?.trim()) errors.push('Title is required');
        if (!this.instructions?.trim()) errors.push('Instructions are required');
        if (!this.template?.trim()) errors.push('Template is required');
        if (this.category !== null && typeof this.category !== 'string') errors.push('Category must be a string or null');

        if (!Array.isArray(this.tags)) {
            errors.push('Tags must be an array');
        } else {
            const tagSet: Set<string> = new Set();
            for (const tag of this.tags) {
                if (typeof tag !== 'string') {
                    errors.push('All tags must be strings');
                    break;
                }
                if (tagSet.has(tag)) {
                    errors.push(`Duplicate tag: '${tag}'`);
                }
                tagSet.add(tag);
            }
        }

        if (errors.length > 0) {
            throw new ValidationError(errors.join('; '));
        }
    }
}