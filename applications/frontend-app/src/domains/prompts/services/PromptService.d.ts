import { Prompt } from "../entities/Prompt";
import type { PromptRepositoryPort } from "../repositories/PromptRepositoryPort";
export declare class PromptService {
    private readonly repository;
    constructor(repository: PromptRepositoryPort);
    /**
     * Retrieves all prompts from the repository.
     * @returns Promise resolving to an array of all prompts
     */
    getPrompts(): Promise<Prompt[]>;
    /**
     * Retrieves a prompt by its ID from the repository.
     * @param id - The unique identifier of the prompt
     * @returns Promise resolving to the prompt with the given ID
     */
    getPromptById(id: string): Promise<Prompt>;
    /**
     * Creates a new prompt in the repository.
     * @param prompt - The prompt entity to create
     * @returns Promise that resolves when the prompt is created
     */
    createPrompt(prompt: Prompt): Promise<void>;
    /**
     * Updates an existing prompt in the repository.
     * @param prompt - The prompt entity with updated data
     * @returns Promise that resolves when the prompt is updated
     */
    updatePrompt(prompt: Prompt): Promise<void>;
    /**
     * Deletes a prompt from the repository by its ID.
     * @param id - The unique identifier of the prompt to delete
     * @returns Promise that resolves when the prompt is deleted
     */
    deletePrompt(id: string): Promise<void>;
}
