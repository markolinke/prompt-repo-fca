import { Prompt } from "../entities/Prompt";
export interface PromptRepositoryPort {
    getPrompts(): Promise<Prompt[]>;
    getPromptById(id: string): Promise<Prompt>;
    createPrompt(prompt: Prompt): Promise<void>;
    updatePrompt(prompt: Prompt): Promise<void>;
    deletePrompt(id: string): Promise<void>;
}
