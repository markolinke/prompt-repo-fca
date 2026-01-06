import { describe, it, expect, beforeEach } from 'vitest';
import { PromptService } from '../services/PromptService';
import { MockPromptRepository } from '../repositories/MockPromptRepository';
import { Prompt } from '../entities/Prompt';
import { PromptNotFoundError } from '../../../common/errors/DomainError';
import { mockData } from './PromptMockData';

describe('PromptService', () => {
    let service: PromptService;
    let repository: MockPromptRepository;

    beforeEach(() => {
        repository = new MockPromptRepository();
        service = new PromptService(repository);
    });

    describe('getPrompts', () => {
        it('should return array of prompts from repository', async () => {
            const prompts = await service.getPrompts();
            
            expect(prompts).toBeInstanceOf(Array);
            expect(prompts.length).toBeGreaterThan(0);
            expect(prompts[0]).toBeInstanceOf(Prompt);
        });

        it('should return empty array when repository has no prompts', async () => {
            const emptyRepository = new MockPromptRepository([]);
            const emptyService = new PromptService(emptyRepository);
            
            const prompts = await emptyService.getPrompts();
            
            expect(prompts).toEqual([]);
        });

        it('should return prompts with correct structure', async () => {
            const prompts = await service.getPrompts();
            
            prompts.forEach(prompt => {
                expect(prompt).toHaveProperty('id');
                expect(prompt).toHaveProperty('title');
                expect(prompt).toHaveProperty('instructions');
                expect(prompt).toHaveProperty('template');
                expect(prompt).toHaveProperty('category');
                expect(prompt).toHaveProperty('tags');
            });
        });
    });

    describe('getPromptById', () => {
        it('should return prompt when found', async () => {
            const expectedPrompt = Prompt.fromPlainObject(mockData.prompts[0]);
            
            const prompt = await service.getPromptById('1');
            
            expect(prompt).toBeInstanceOf(Prompt);
            expect(prompt.id).toBe('1');
            expect(prompt.title).toBe(expectedPrompt.title);
        });

        it('should throw PromptNotFoundError when prompt does not exist', async () => {
            await expect(service.getPromptById('non-existent-id')).rejects.toThrow(PromptNotFoundError);
        });

        it('should throw PromptNotFoundError with correct message', async () => {
            const nonExistentId = 'non-existent-id';
            
            await expect(service.getPromptById(nonExistentId)).rejects.toThrow(
                `Prompt with id ${nonExistentId} not found`
            );
        });

        it('should return correct prompt for different ids', async () => {
            const prompt1 = await service.getPromptById('1');
            const prompt2 = await service.getPromptById('2');
            
            expect(prompt1.id).toBe('1');
            expect(prompt2.id).toBe('2');
            expect(prompt1.title).not.toBe(prompt2.title);
        });
    });

    describe('createPrompt', () => {
        it('should successfully create prompt', async () => {
            const newPrompt = new Prompt(
                '5',
                'New Prompt',
                'Test instructions',
                'Test template',
                'test/category',
                ['test', 'tag']
            );
            
            await service.createPrompt(newPrompt);
            
            const createdPrompt = await service.getPromptById('5');
            expect(createdPrompt).toEqual(newPrompt);
        });

        it('should add prompt to repository', async () => {
            const initialPrompts = await service.getPrompts();
            const initialCount = initialPrompts.length;
            
            const newPrompt = new Prompt(
                '4',
                'Another Prompt',
                'Another instructions',
                'Another template',
                null,
                []
            );
            
            await service.createPrompt(newPrompt);
            
            const updatedPrompts = await service.getPrompts();
            expect(updatedPrompts.length).toBe(initialCount + 1);
        });

        it('should create prompt with all properties', async () => {
            const newPrompt = new Prompt(
                '5',
                'Full Prompt',
                'Full instructions',
                'Full template',
                'full/category',
                ['tag1', 'tag2']
            );
            
            await service.createPrompt(newPrompt);
            
            const createdPrompt = await service.getPromptById('5');
            expect(createdPrompt.id).toBe('5');
            expect(createdPrompt.title).toBe('Full Prompt');
            expect(createdPrompt.instructions).toBe('Full instructions');
            expect(createdPrompt.template).toBe('Full template');
            expect(createdPrompt.category).toBe('full/category');
            expect(createdPrompt.tags).toEqual(['tag1', 'tag2']);
        });
    });

    describe('updatePrompt', () => {
        it('should successfully update existing prompt', async () => {
            const existingPrompt = await service.getPromptById('1');
            const updatedPrompt = new Prompt(
                existingPrompt.id,
                'Updated Title',
                existingPrompt.instructions,
                existingPrompt.template,
                existingPrompt.category,
                [...existingPrompt.tags]
            );
            
            await service.updatePrompt(updatedPrompt);
            
            const result = await service.getPromptById('1');
            expect(result.title).toBe('Updated Title');
        });

        it('should update all prompt properties', async () => {
            const updatedPrompt = new Prompt(
                '1',
                'New Title',
                'New Instructions',
                'New Template',
                'new/category',
                ['new', 'tags']
            );
            
            await service.updatePrompt(updatedPrompt);
            
            const result = await service.getPromptById('1');
            expect(result.title).toBe('New Title');
            expect(result.instructions).toBe('New Instructions');
            expect(result.template).toBe('New Template');
            expect(result.category).toBe('new/category');
            expect(result.tags).toEqual(['new', 'tags']);
        });

        it('should handle update of non-existent prompt gracefully', async () => {
            const nonExistentPrompt = new Prompt(
                '999',
                'Non-existent',
                'Instructions',
                'Template',
                null,
                []
            );
            
            // MockPromptRepository doesn't throw on update of non-existent, it just does nothing
            await expect(service.updatePrompt(nonExistentPrompt)).resolves.not.toThrow();
        });
    });

    describe('deletePrompt', () => {
        it('should successfully delete prompt', async () => {
            // First verify prompt exists
            await expect(service.getPromptById('1')).resolves.toBeInstanceOf(Prompt);
            
            await service.deletePrompt('1');
            
            // Then verify it's deleted
            await expect(service.getPromptById('1')).rejects.toThrow(PromptNotFoundError);
        });

        it('should remove prompt from repository', async () => {
            const initialPrompts = await service.getPrompts();
            const initialCount = initialPrompts.length;
            
            await service.deletePrompt('1');
            
            const updatedPrompts = await service.getPrompts();
            expect(updatedPrompts.length).toBe(initialCount - 1);
            expect(updatedPrompts.find(p => p.id === '1')).toBeUndefined();
        });

        it('should handle deletion of non-existent prompt gracefully', async () => {
            // MockPromptRepository doesn't throw on delete of non-existent, it just does nothing
            await expect(service.deletePrompt('non-existent-id')).resolves.not.toThrow();
        });

        it('should only delete the specified prompt', async () => {
            const initialPrompts = await service.getPrompts();
            const initialCount = initialPrompts.length;
            
            await service.deletePrompt('1');
            
            const updatedPrompts = await service.getPrompts();
            expect(updatedPrompts.length).toBe(initialCount - 1);
            // Verify other prompts still exist
            await expect(service.getPromptById('2')).resolves.toBeInstanceOf(Prompt);
        });
    });

    describe('searchPrompts', () => {
        it('should return all prompts when query is empty string', async () => {
            const allPrompts = await service.getPrompts();
            const searchResults = await service.searchPrompts('');
            
            expect(searchResults).toEqual(allPrompts);
            expect(searchResults.length).toBe(allPrompts.length);
        });

        it('should return all prompts when query is null', async () => {
            const allPrompts = await service.getPrompts();
            const searchResults = await service.searchPrompts(null as any);
            
            expect(searchResults).toEqual(allPrompts);
            expect(searchResults.length).toBe(allPrompts.length);
        });

        it('should return prompts whose title contains the search term', async () => {
            const results = await service.searchPrompts('Design');
            
            expect(results.length).toBe(2);
            expect(results.some(p => p.id === '1')).toBe(true);
            expect(results.some(p => p.id === '2')).toBe(true);
            results.forEach(prompt => {
                expect(prompt.title).toContain('Design');
            });
        });

        it('should return prompts whose category contains the search term', async () => {
            const results = await service.searchPrompts('coding');
            
            expect(results.length).toBe(1);
            expect(results[0].id).toBe('4');
            expect(results[0].category).toContain('coding');
        });

        it('should return prompts matching either title or category', async () => {
            // Search for 'design' (lowercase) - should match categories but not titles (which have 'Design')
            const results = await service.searchPrompts('design');
            
            expect(results.length).toBe(2);
            expect(results.some(p => p.id === '1')).toBe(true);
            expect(results.some(p => p.id === '2')).toBe(true);
            // Verify each result matches either title or category
            results.forEach(prompt => {
                const matchesTitle = prompt.title.includes('design');
                const matchesCategory = prompt.category?.includes('design') ?? false;
                expect(matchesTitle || matchesCategory).toBe(true);
            });
        });

        it('should return prompts where title matches even if category is null', async () => {
            const results = await service.searchPrompts('without');
            
            expect(results.length).toBe(2);
            expect(results.some(p => p.id === '3')).toBe(true);
            expect(results.some(p => p.id === '4')).toBe(true);
            results.forEach(prompt => {
                expect(prompt.title).toContain('without');
            });
        });

        it('should return empty array when search term does not match any prompt', async () => {
            const results = await service.searchPrompts('nonexistent-term-that-will-never-match');
            
            expect(results).toEqual([]);
            expect(results.length).toBe(0);
        });

        it('should return all prompts when query is undefined', async () => {
            const allPrompts = await service.getPrompts();
            const searchResults = await service.searchPrompts(undefined as any);
            
            expect(searchResults).toEqual(allPrompts);
            expect(searchResults.length).toBe(allPrompts.length);
        });
    });
});

