import { defineStore } from 'pinia';
import { Prompt } from '../entities/Prompt';
import { PromptService } from '../services/PromptService';
import { MockPromptRepository } from '../repositories/MockPromptRepository';

interface PromptsState {
    prompts: Prompt[];
    loading: boolean;
    error: string | null;
}

export const usePromptsStore = defineStore('prompts', {
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
                const repository = new MockPromptRepository();
                const service = new PromptService(repository);
                this.prompts = await service.getPrompts();
            } catch (error) {
                this.error = error instanceof Error ? error.message : 'Failed to fetch prompts';
            } finally {
                this.loading = false;
            }
        },
    },
});

