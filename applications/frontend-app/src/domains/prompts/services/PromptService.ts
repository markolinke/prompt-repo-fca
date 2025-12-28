import { Prompt } from "../entities/Prompt";
import type { PromptRepositoryPort } from "../repositories/PromptRepositoryPort";

export class PromptService {
    constructor(
        private readonly repository: PromptRepositoryPort
    ) {}

    async getPrompts(): Promise<Prompt[]> {
        return this.repository.getPrompts();
    }

    async getPromptById(id: string): Promise<Prompt> {
        return this.repository.getPromptById(id);
    }

    async createPrompt(prompt: Prompt): Promise<void> {
        return this.repository.createPrompt(prompt);
    }

    async updatePrompt(prompt: Prompt): Promise<void> {
        return this.repository.updatePrompt(prompt);
    }

    async deletePrompt(id: string): Promise<void> {
        return this.repository.deletePrompt(id);
    }
}

