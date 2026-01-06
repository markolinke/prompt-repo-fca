import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { mockBootstrapPrompts } from '../testHelpers';

mockBootstrapPrompts(); // Must be called before importing components

import PromptsPage from '../../pages/PromptsPage.vue';
import { mockData } from '../PromptMockData';

describe('Filtering Prompts', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('When entering a filter/search term', () => {
    it('should display only prompts whose title or category contains the term', async () => {
      // Given: User is on prompts list page with all prompts loaded
      const wrapper = mount(PromptsPage);

      // Wait for initial data load
      await new Promise(resolve => setTimeout(resolve, 100));
      await wrapper.vm.$nextTick();

      // Verify all prompts are displayed initially
      const allPrompts = mockData.prompts;
      expect(wrapper.text()).not.toContain('No prompts found.');
      const initialPromptItems = wrapper.findAll('[data-testid="prompt-item"]');
      expect(initialPromptItems.length).toBe(allPrompts.length);

      // When: User enters a search term that matches title
      const searchInput = wrapper.find('[data-testid="search-input"]');
      await searchInput.setValue('Design');
      
      // Wait for debounce delay (500ms) + Vue updates
      await new Promise(resolve => setTimeout(resolve, 550));
      await wrapper.vm.$nextTick();

      // Then: Only matching prompts are displayed
      // "Design" should match prompts 1 and 2 (both have "Design" in title)
      const filteredItems = wrapper.findAll('[data-testid="prompt-item"]');
      expect(filteredItems.length).toBe(2);
      expect(wrapper.text()).toContain('Design a new feature');
      expect(wrapper.text()).toContain('Design a new user interface');
      expect(wrapper.text()).not.toContain('Prompt without category');
      expect(wrapper.text()).not.toContain('Prompt without tags');
    });

    it('should filter by category when search term matches category', async () => {
      // Given: User is on prompts list page
      const wrapper = mount(PromptsPage);
      await new Promise(resolve => setTimeout(resolve, 100));
      await wrapper.vm.$nextTick();

      // When: User enters a search term that matches category
      const searchInput = wrapper.find('[data-testid="search-input"]');
      await searchInput.setValue('coding');
      
      // Wait for debounce delay
      await new Promise(resolve => setTimeout(resolve, 550));
      await wrapper.vm.$nextTick();

      // Then: Only prompt with matching category is displayed
      const filteredItems = wrapper.findAll('[data-testid="prompt-item"]');
      expect(filteredItems.length).toBe(1);
      expect(wrapper.text()).toContain('Prompt without tags');
      expect(wrapper.text()).toContain('coding/review');
      expect(wrapper.text()).not.toContain('Design a new feature');
      expect(wrapper.text()).not.toContain('Design a new user interface');
      expect(wrapper.text()).not.toContain('Prompt without category');
    });

    it('should show empty state when search term matches nothing', async () => {
      // Given: User is on prompts list page
      const wrapper = mount(PromptsPage);
      await new Promise(resolve => setTimeout(resolve, 100));
      await wrapper.vm.$nextTick();

      // When: User enters a search term that doesn't match any prompt
      const searchInput = wrapper.find('[data-testid="search-input"]');
      await searchInput.setValue('nonexistent-search-term');
      
      // Wait for debounce delay
      await new Promise(resolve => setTimeout(resolve, 550));
      await wrapper.vm.$nextTick();

      // Then: Empty state is shown
      expect(wrapper.text()).toContain('No prompts found.');
      const filteredItems = wrapper.findAll('[data-testid="prompt-item"]');
      expect(filteredItems.length).toBe(0);
    });

    it('should wait 500ms before applying the filter', async () => {
      // Given: User is on prompts list page
      const wrapper = mount(PromptsPage);
      await new Promise(resolve => setTimeout(resolve, 100));
      await wrapper.vm.$nextTick();

      const allPrompts = mockData.prompts;
      const initialCount = wrapper.findAll('[data-testid="prompt-item"]').length;
      expect(initialCount).toBe(allPrompts.length);

      // When: User types a search term
      const searchInput = wrapper.find('[data-testid="search-input"]');
      await searchInput.setValue('Design');

      // Then: Results should NOT change immediately (before 500ms)
      await new Promise(resolve => setTimeout(resolve, 100));
      await wrapper.vm.$nextTick();
      const beforeDelayCount = wrapper.findAll('[data-testid="prompt-item"]').length;
      expect(beforeDelayCount).toBe(initialCount); // Still showing all prompts

      // When: Wait for debounce delay (500ms)
      await new Promise(resolve => setTimeout(resolve, 450)); // Total 550ms from typing
      await wrapper.vm.$nextTick();

      // Then: Results should change after delay
      const afterDelayCount = wrapper.findAll('[data-testid="prompt-item"]').length;
      expect(afterDelayCount).toBe(2); // Filtered to 2 prompts
      expect(afterDelayCount).not.toBe(initialCount);
    });

    it('should show all prompts when search is cleared', async () => {
      // Given: User is on prompts list page with a search applied
      const wrapper = mount(PromptsPage);
      await new Promise(resolve => setTimeout(resolve, 100));
      await wrapper.vm.$nextTick();

      // Apply a search
      const searchInput = wrapper.find('[data-testid="search-input"]');
      await searchInput.setValue('Design');
      await new Promise(resolve => setTimeout(resolve, 550));
      await wrapper.vm.$nextTick();

      // Verify search is applied
      const filteredCount = wrapper.findAll('[data-testid="prompt-item"]').length;
      expect(filteredCount).toBe(2);

      // When: User clears the search
      await searchInput.setValue('');
      
      // Wait for debounce delay
      await new Promise(resolve => setTimeout(resolve, 550));
      await wrapper.vm.$nextTick();

      // Then: All prompts are displayed again
      const allPrompts = mockData.prompts;
      const clearedCount = wrapper.findAll('[data-testid="prompt-item"]').length;
      expect(clearedCount).toBe(allPrompts.length);
      expect(wrapper.text()).not.toContain('No prompts found.');
      
      // Verify all prompts are visible
      allPrompts.forEach(prompt => {
        expect(wrapper.text()).toContain(prompt.title);
      });
    });

    it('should match prompts by either title or category', async () => {
      // Given: User is on prompts list page
      const wrapper = mount(PromptsPage);
      await new Promise(resolve => setTimeout(resolve, 100));
      await wrapper.vm.$nextTick();

      // When: User enters a search term that could match either title or category
      // "design" matches category in prompts 1 and 2, but not titles (which have "Design" with capital D)
      const searchInput = wrapper.find('[data-testid="search-input"]');
      await searchInput.setValue('design');
      
      // Wait for debounce delay
      await new Promise(resolve => setTimeout(resolve, 550));
      await wrapper.vm.$nextTick();

      // Then: Prompts matching either title or category are displayed
      // Note: This test depends on case sensitivity of the search implementation
      // If case-sensitive, "design" will match categories "design/features" and "design/ui"
      const filteredItems = wrapper.findAll('[data-testid="prompt-item"]');
      // The search should find prompts where category contains "design"
      expect(filteredItems.length).toBeGreaterThan(0);
      expect(wrapper.text()).toContain('design/features');
      expect(wrapper.text()).toContain('design/ui');
    });
  });
});

