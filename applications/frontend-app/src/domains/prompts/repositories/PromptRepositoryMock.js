import { Prompt } from "../entities/Prompt";
import { PromptNotFoundError } from "../../../common/errors/DomainError";
import { mockData } from "../tests/PromptMockData";
export class PromptRepositoryMock {
    prompts;
    _defaultPrompts = mockData.prompts.map(prompt => Prompt.fromPlainObject(prompt));
    constructor(initialPrompts = undefined) {
        this.prompts = initialPrompts ?? this._defaultPrompts;
    }
    getPrompts() {
        return Promise.resolve(this.prompts);
    }
    getPromptById(id) {
        const prompt = this.prompts.find(prompt => prompt.id === id) ?? null;
        if (prompt === null) {
            return Promise.reject(new PromptNotFoundError(id));
        }
        return Promise.resolve(prompt);
    }
    createPrompt(prompt) {
        this.prompts.push(prompt);
        return Promise.resolve();
    }
    updatePrompt(prompt) {
        const index = this.prompts.findIndex(p => p.id === prompt.id);
        if (index !== -1) {
            this.prompts[index] = prompt;
        }
        return Promise.resolve();
    }
    deletePrompt(id) {
        this.prompts = this.prompts.filter(prompt => prompt.id !== id);
        return Promise.resolve();
    }
}
