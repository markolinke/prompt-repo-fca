import { ValidationError } from '../../../common/errors/DomainError';

export class Note {
    readonly id: string;
    readonly title: string;
    readonly content: string;
    readonly last_modified_utc: Date;
    readonly category: string | null;
    readonly tags: readonly string[];

    constructor(
        id: string,
        title: string,
        content: string,
        last_modified_utc: Date,
        category: string | null,
        tags: string[]
    ) {        
        this.id = id;
        this.title = title;
        this.content = content;
        this.last_modified_utc = last_modified_utc;
        this.category = category;
        this.tags = Object.freeze([...tags]) as readonly string[];
    }

    /**
     * Creates a Note instance from a plain object (for deserialization).
     * @throws {ValidationError} if validation fails
     */
    static fromPlainObject(data: {
        id: string;
        title: string;
        content: string;
        last_modified_utc: Date | string;
        category: string | null;
        tags: string[];
    }): Note {
        // Convert last_modified_utc from string to Date if needed
        const lastModifiedDate = typeof data.last_modified_utc === 'string' 
            ? new Date(data.last_modified_utc) 
            : data.last_modified_utc;

        return new Note(
            data.id,
            data.title,
            data.content,
            lastModifiedDate,
            data.category,
            data.tags
        );
    }

    /**
     * Validates note properties according to domain rules.
     * @throws {ValidationError} if validation fails
     */
    public validate(): void {
        const errors: string[] = [];
        
        if (!this.id?.trim()) errors.push('ID is required');
        if (!this.title?.trim()) errors.push('Title is required');
        if (!this.content?.trim()) errors.push('Content is required');

        if (errors.length > 0) {
            throw new ValidationError(`Validation failed: ${errors.join('; ')}`, errors);
        }
    }
}