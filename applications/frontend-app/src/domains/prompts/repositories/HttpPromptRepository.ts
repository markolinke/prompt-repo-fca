import type { HttpClientPort } from "@/common/http/HttpClientPort";
import { Prompt } from "../entities/Prompt";
import type { PromptRepositoryPort } from "./PromptRepositoryPort";

export class HttpPromptRepository implements PromptRepositoryPort {
    constructor(
        private readonly apiClient: HttpClientPort
    ) {}

    getPrompts(): Promise<Prompt[]> {
        return this.apiClient.get('/prompts');
    }

    getPromptById(id: string): Promise<Prompt> {
        return this.apiClient.get(`/prompts/${id}`);
    }

    createPrompt(prompt: Prompt): Promise<void> {
        return this.apiClient.post('/prompts', prompt);
    }
    
    updatePrompt(prompt: Prompt): Promise<void> {
        return this.apiClient.put(`/prompts/${prompt.id}`, prompt);
    }

    deletePrompt(id: string): Promise<void> {
        return this.apiClient.delete(`/prompts/${id}`);
    }
}