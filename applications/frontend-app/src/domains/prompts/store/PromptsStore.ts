import { defineStore } from 'pinia';
import { Prompt } from '../entities/Prompt';

interface PromptsState {
    prompts: Prompt[];
    loading: boolean;
    error: string | null;
}

type PromptServiceShape = {
    getPrompts(): Promise<Prompt[]>;
    getPromptById(id: string): Promise<Prompt>;
    createPrompt(prompt: Prompt): Promise<void>;
    updatePrompt(prompt: Prompt): Promise<void>;
    deletePrompt(id: string): Promise<void>;
};

export const createPromptsStore = (promptService: PromptServiceShape) => {
    return defineStore('prompts', {
        state: (): PromptsState => ({
            prompts: [],
            loading: false,
            error: null,
        }),

        actions: {
            async fetchPrompts(): Promise<void> {
                this.loading = true;
                this.error = null;

                try {
                    this.prompts = await promptService.getPrompts();
                } catch (error) {
                    this.error = error instanceof Error ? error.message : 'Failed to fetch prompts';
                } finally {
                    this.loading = false;
                }
            },

            async createPrompt(prompt: Prompt): Promise<void> {
                this.loading = true;
                this.error = null;

                try {
                    await promptService.createPrompt(prompt);
                    this.prompts = await promptService.getPrompts();
                } catch (error) {
                    this.error = error instanceof Error ? error.message : 'Failed to create prompt';
                    throw error;
                } finally {
                    this.loading = false;
                }
            },

            async updatePrompt(prompt: Prompt): Promise<void> {
                this.loading = true;
                this.error = null;

                try {
                    await promptService.updatePrompt(prompt);
                    // Update the prompt in the local state
                    const index = this.prompts.findIndex(p => p.id === prompt.id);
                    if (index !== -1) {
                        this.prompts[index] = prompt;
                    }
                } catch (error) {
                    this.error = error instanceof Error ? error.message : 'Failed to update prompt';
                    throw error;
                } finally {
                    this.loading = false;
                }
            },

            async deletePrompt(id: string): Promise<void> {
                this.loading = true;
                this.error = null;

                try {
                    await promptService.deletePrompt(id);
                    this.prompts = await promptService.getPrompts();
                } catch (error) {
                    this.error = error instanceof Error ? error.message : 'Failed to delete prompt';
                    throw error;
                } finally {
                    this.loading = false;
                }
            },
        },
    });
}
