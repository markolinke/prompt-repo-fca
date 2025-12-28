import { Prompt } from "../entities/Prompt";
import type { PromptRepositoryPort } from "../repositories/PromptRepositoryPort";

export class PromptService {
    constructor(
        private readonly repository: PromptRepositoryPort
    ) {}

    /**
     * Retrieves all prompts from the repository.
     * @returns Promise resolving to an array of all prompts
     */
    async getPrompts(): Promise<Prompt[]> {
        return this.repository.getPrompts();
    }

    /**
     * Retrieves a prompt by its ID from the repository.
     * @param id - The unique identifier of the prompt
     * @returns Promise resolving to the prompt with the given ID
     */
    async getPromptById(id: string): Promise<Prompt> {
        return this.repository.getPromptById(id);
    }

    /**
     * Creates a new prompt in the repository.
     * @param prompt - The prompt entity to create
     * @returns Promise that resolves when the prompt is created
     */
    async createPrompt(prompt: Prompt): Promise<void> {
        return this.repository.createPrompt(prompt);
    }

    /**
     * Updates an existing prompt in the repository.
     * @param prompt - The prompt entity with updated data
     * @returns Promise that resolves when the prompt is updated
     */
    async updatePrompt(prompt: Prompt): Promise<void> {
        return this.repository.updatePrompt(prompt);
    }

    /**
     * Deletes a prompt from the repository by its ID.
     * @param id - The unique identifier of the prompt to delete
     * @returns Promise that resolves when the prompt is deleted
     */
    async deletePrompt(id: string): Promise<void> {
        return this.repository.deletePrompt(id);
    }
}

