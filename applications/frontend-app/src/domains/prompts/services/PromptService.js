import { Prompt } from "../entities/Prompt";
export class PromptService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    /**
     * Retrieves all prompts from the repository.
     * @returns Promise resolving to an array of all prompts
     */
    async getPrompts() {
        return this.repository.getPrompts();
    }
    /**
     * Retrieves a prompt by its ID from the repository.
     * @param id - The unique identifier of the prompt
     * @returns Promise resolving to the prompt with the given ID
     */
    async getPromptById(id) {
        return this.repository.getPromptById(id);
    }
    /**
     * Creates a new prompt in the repository.
     * @param prompt - The prompt entity to create
     * @returns Promise that resolves when the prompt is created
     */
    async createPrompt(prompt) {
        return this.repository.createPrompt(prompt);
    }
    /**
     * Updates an existing prompt in the repository.
     * @param prompt - The prompt entity with updated data
     * @returns Promise that resolves when the prompt is updated
     */
    async updatePrompt(prompt) {
        return this.repository.updatePrompt(prompt);
    }
    /**
     * Deletes a prompt from the repository by its ID.
     * @param id - The unique identifier of the prompt to delete
     * @returns Promise that resolves when the prompt is deleted
     */
    async deletePrompt(id) {
        return this.repository.deletePrompt(id);
    }
}
