import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { mockBootstrapPrompts } from '../testHelpers';

mockBootstrapPrompts(); // Must be called before importing components

import PromptsPage from '../../pages/PromptsPage.vue';
import { mockData } from '../PromptMockData';

describe('Browsing Prompts', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('When browsing the prompts section without applying any filters or search', () => {
    it('should display all prompts in the list', async () => {
      // Given: User navigates to prompts page
      const wrapper = mount(PromptsPage);

      // Wait for initial data load (async operations)
      await new Promise(resolve => setTimeout(resolve, 100));
      await wrapper.vm.$nextTick();

      // Then: All prompts are displayed
      // Verify prompts list is rendered (not loading/error/empty state)
      expect(wrapper.text()).not.toContain('Loading prompts...');
      expect(wrapper.text()).not.toContain('Error:');
      expect(wrapper.text()).not.toContain('No prompts found.');

      // Verify all prompts from mock data are visible in the rendered output
      const allPrompts = mockData.prompts;
      allPrompts.forEach(prompt => {
        expect(wrapper.text()).toContain(prompt.title);
        expect(wrapper.text()).toContain(prompt.instructions);
        
        // Verify category is displayed if present
        if (prompt.category) {
          expect(wrapper.text()).toContain(prompt.category);
        }

        // Verify tags are displayed if present
        if (prompt.tags && prompt.tags.length > 0) {
          prompt.tags.forEach(tag => {
            expect(wrapper.text()).toContain(tag);
          });
        }
      });

      // Verify the number of displayed prompts matches repository data
      // Find prompt items by their container class (user-visible styling)
      const promptItems = wrapper.findAll('[data-testid="prompt-item"]');
      expect(promptItems.length).toBe(allPrompts.length);
    });
  });
});

