import { Prompt } from "../entities/Prompt";
import type { PromptRepositoryPort } from "../repositories/PromptRepositoryPort";
export declare class PromptRepositoryMock implements PromptRepositoryPort {
    private prompts;
    private readonly _defaultPrompts;
    constructor(initialPrompts?: Prompt[] | undefined);
    getPrompts(): Promise<Prompt[]>;
    getPromptById(id: string): Promise<Prompt>;
    createPrompt(prompt: Prompt): Promise<void>;
    updatePrompt(prompt: Prompt): Promise<void>;
    deletePrompt(id: string): Promise<void>;
}
