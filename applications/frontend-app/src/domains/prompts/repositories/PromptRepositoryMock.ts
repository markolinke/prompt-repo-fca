import { Prompt } from "../entities/Prompt";
import { PromptNotFoundError } from "../../../common/errors/DomainError";
import { PromptRepositoryPort } from "../repositories/PromptRepositoryPort";

export class PromptRepositoryMock implements PromptRepositoryPort {
    private prompts: Prompt[];
    private readonly _defaultPrompts: Prompt[] = [
        Prompt.fromPlainObject({
            id: '1',
            title: 'Design a new feature',
            instructions: 'Design a new feature for the product',
            template: 'Design a new feature for the product',
            category: 'design/features',
            tags: ['design', 'features', 'shared']
        }),
        Prompt.fromPlainObject({
            id: '2',
            title: 'Design a new user interface',
            instructions: 'Design a new user interface for the product',
            template: 'Design a new user interface for the product',
            category: 'design/ui',
            tags: ['design', 'ui', 'shared']
        })
    ];

    constructor(initialPrompts: Prompt[] | undefined = undefined) {
        this.prompts = initialPrompts ?? this._defaultPrompts;
    }

    getPrompts(): Promise<Prompt[]> {
        return Promise.resolve(this.prompts);
    }

    getPromptById(id: string): Promise<Prompt> {
        const prompt = this.prompts.find(prompt => prompt.id === id) ?? null;
        if (prompt === null) {
            return Promise.reject(new PromptNotFoundError(id));
        }
        return Promise.resolve(prompt);
    }

    createPrompt(prompt: Prompt): Promise<void> {
        this.prompts.push(prompt);
        return Promise.resolve();
    }

    updatePrompt(prompt: Prompt): Promise<void> {
        const index = this.prompts.findIndex(p => p.id === prompt.id);
        if (index !== -1) {
            this.prompts[index] = prompt;
        }
        return Promise.resolve();
    }

    deletePrompt(id: string): Promise<void> {
        this.prompts = this.prompts.filter(prompt => prompt.id !== id);
        return Promise.resolve();
    }
}

export const PromptMockData : Prompt[] = [
    Prompt.fromPlainObject({
        id: '1',
        title: 'Design a new feature',
        instructions: 'Design a new feature for the product',
        template: 'Design a new feature for the product',
        category: 'design/features',
        tags: ['design', 'features', 'shared']
    }),
    Prompt.fromPlainObject({
        id: '2',
        title: 'Design a new user interface',
        instructions: 'Design a new user interface for the product',
        template: 'Design a new user interface for the product',
        category: 'design/ui',
        tags: ['design', 'ui', 'shared']
    })
];