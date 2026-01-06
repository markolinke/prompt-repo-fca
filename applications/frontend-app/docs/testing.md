# Testing Guidelines

## Philosophy

Our testing strategy focuses on **business value and user workflows**, not technical implementation details. We test **use cases and user stories**, not individual components or stores in isolation. This approach ensures that tests verify whether features work for users, not just whether code executes correctly.

We follow a **domain-level integration testing** approach:

- **Real Components** + **Real Store** + **Real Service** + **Mock Repository**
- Tests verify complete user workflows from UI interaction to data persistence
- Minimal mocking (only at the repository boundary)
- Tests are resilient to refactoring since they focus on business processes

For true end-to-end testing (browser automation, cross-browser, visual regression), use external tools like Playwright in a separate project.

## Core Principles

- **Test Business Processes**: Test whether "creating a prompt" works, not whether a component renders
- **Integration Over Isolation**: Test the full stack within the domain (components → store → service → repository)
- **Use Case Organization**: Organize tests by user story/use case, not by component or technical layer
- **Single Mock Boundary**: Mock only at the repository level (the data boundary)
- **Colocation**: Tests live in `domains/<feature>/tests/` alongside the feature code
- **Clarity**: Test names describe user workflows, not technical operations

## Testing Strategy

### Two Types of Tests

1. **Unit Tests** (Service Layer)
   - Test services with mock repositories
   - Verify business logic and error handling
   - Located in `domains/<feature>/tests/<Service>.test.ts`
   - Example: `PromptService.test.ts`

2. **Integration Tests** (Use Case Level)
   - Test complete user workflows
   - Real components + real store + real service + mock repository
   - Located in `domains/<feature>/tests/use-cases/`
   - Example: `creating-prompts.test.ts`, `viewing-prompts.test.ts`

### What We Test

✅ **DO Test:**

- Complete user workflows (e.g., "user can create a prompt")
- Business processes end-to-end (UI → Store → Service → Repository)
- User interactions and their outcomes
- Error states and edge cases from user perspective
- Validation rules as users experience them

❌ **DON'T Test:**

- Component rendering in isolation (unless testing complex presentation logic)
- Store actions in isolation (tested via integration tests)
- Implementation details (e.g., "does component call store method X")
- Technical details that don't affect user experience

## Test Organization

### Structure

```text
domains/<feature>/tests/
├── <Service>.test.ts              # Unit tests (service layer)
├── <Feature>MockData.ts           # Shared test data
└── use-cases/                     # Integration tests
    ├── viewing-<feature>.test.ts
    ├── creating-<feature>.test.ts
    ├── editing-<feature>.test.ts
    └── deleting-<feature>.test.ts
```

### Naming Convention

- **Unit tests**: `<Service>.test.ts` (e.g., `PromptService.test.ts`)
- **Integration tests**: `<use-case>-<feature>.test.ts` (e.g., `creating-prompts.test.ts`)
- **Test descriptions**: Use user story format (e.g., "As a user, I can create a prompt")

## Integration Test Setup

### Mocking Bootstrap

We use **bootstrap mocking** to bypass `appDependencies` singleton and ensure complete test isolation. This approach:

- ✅ **Eliminates shared state**: Each test gets a fresh store instance
- ✅ **Prevents flakiness**: No singleton state leaks between tests
- ✅ **Simplifies setup**: No need to initialize `appDependencies`
- ✅ **Tests full stack**: Still tests components + store + service + repository

**Standard Pattern**:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import PromptsPage from '../pages/PromptsPage.vue';
import { PromptService } from '../services/PromptService';
import { MockPromptRepository } from '../repositories/MockPromptRepository';
import { createPromptsStore } from '../store/PromptsStore';

// Mock bootstrap to bypass appDependencies singleton
vi.mock('../bootstrap', () => {
  const repository = new MockPromptRepository();
  const service = new PromptService(repository);
  const store = createPromptsStore(service);
  
  return {
    bootstrapPrompts: () => ({
      useStore: store,
      routes: [],
    }),
  };
});

describe('Creating Prompts', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  // Tests here...
});
```

**Why This Approach**:

- `appDependencies` is a singleton that can leak state between tests
- Bootstrap mocking creates a fresh store instance for each test
- No need to manage `appDependencies` lifecycle in tests
- Still tests the complete integration (all layers except bootstrap wiring)

### Test Helper Pattern

For reusable setup, create test helpers that set up the mocked bootstrap:

```typescript
// tests/testHelpers.ts
import { setActivePinia, createPinia } from 'pinia';
import { PromptService } from '../services/PromptService';
import { MockPromptRepository } from '../repositories/MockPromptRepository';
import { createPromptsStore } from '../store/PromptsStore';
import { vi } from 'vitest';

/**
 * Mocks the bootstrap function for a feature.
 * IMPORTANT: This must be called at the top level of your test file,
 * before any imports that use the bootstrap.
 * 
 * Creates a factory that returns fresh instances for each bootstrap call,
 * ensuring complete test isolation.
 * 
 * Usage:
 * ```typescript
 * import { mockBootstrap } from './testHelpers';
 * mockBootstrap(); // Call at top level
 * 
 * import PromptsPage from '../pages/PromptsPage.vue'; // Now safe to import
 * ```
 */
export const mockBootstrap = () => {
  vi.mock('../bootstrap', () => {
    // Return a factory that creates fresh instances for each call
    return {
      bootstrapPrompts: () => {
        const repository = new MockPromptRepository();
        const service = new PromptService(repository);
        const store = createPromptsStore(service);
        return {
          useStore: store,
          routes: [],
        };
      },
    };
  });
};

/**
 * Creates a test store with custom repository data.
 * Useful for testing edge cases (empty state, error states, etc.).
 */
export const createTestStoreWithData = (initialPrompts: Prompt[] = []) => {
  setActivePinia(createPinia());
  
  const repository = new MockPromptRepository(initialPrompts);
  const service = new PromptService(repository);
  const store = createPromptsStore(service);
  
  return { repository, service, store };
};
```

## Example: Use Case-Based Integration Test

### Test File: `tests/use-cases/creating-prompts.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import PromptsPage from '../pages/PromptsPage.vue';
import { PromptService } from '../services/PromptService';
import { MockPromptRepository } from '../repositories/MockPromptRepository';
import { createPromptsStore } from '../store/PromptsStore';
import { Prompt } from '../entities/Prompt';
import { mockData } from '../PromptMockData';

// Mock bootstrap to ensure test isolation
vi.mock('../bootstrap', () => {
  const repository = new MockPromptRepository();
  const service = new PromptService(repository);
  const store = createPromptsStore(service);
  
  return {
    bootstrapPrompts: () => ({
      useStore: store,
      routes: [],
    }),
  };
});

describe('Creating Prompts', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('As a user, I can create a new prompt', () => {
    it('should create and display a prompt after filling the form', async () => {
      // Given: User is on prompts page
      const wrapper = mount(PromptsPage);
      
      // Wait for initial load
      await new Promise(resolve => setTimeout(resolve, 100));
      await wrapper.vm.$nextTick();
      
      const initialCount = wrapper.findAll('li').length;

      // When: User clicks "Add Prompt" and fills the form
      const addButton = wrapper.find('fwb-button');
      await addButton.trigger('click');
      await wrapper.vm.$nextTick();

      // Fill form
      const promptDetails = wrapper.findComponent({ name: 'PromptDetails' });
      await promptDetails.find('#edit-title').setValue('New Test Prompt');
      await promptDetails.find('#edit-instructions').setValue('Test instructions');
      await promptDetails.find('#edit-template').setValue('Test template');
      
      // Save
      const saveButton = promptDetails.findAll('fwb-button').find(
        btn => btn.attributes('color') === 'blue'
      );
      await saveButton?.trigger('click');
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));
      await wrapper.vm.$nextTick();

      // Then: The prompt appears in the list
      expect(wrapper.text()).toContain('New Test Prompt');
      expect(wrapper.findAll('li').length).toBe(initialCount + 1);
    });

    it('should prevent creating a prompt without required fields', async () => {
      // Given: User opens create form
      const wrapper = mount(PromptsPage);
      await new Promise(resolve => setTimeout(resolve, 100));
      await wrapper.vm.$nextTick();
      
      const addButton = wrapper.find('fwb-button');
      await addButton.trigger('click');
      await wrapper.vm.$nextTick();

      // When: User tries to save without filling required fields
      const promptDetails = wrapper.findComponent({ name: 'PromptDetails' });
      const saveButton = promptDetails.findAll('fwb-button').find(
        btn => btn.attributes('color') === 'blue'
      );
      await saveButton?.trigger('click');
      await wrapper.vm.$nextTick();

      // Then: Validation errors are shown
      expect(wrapper.text()).toContain('Title is required');
      expect(wrapper.text()).toContain('Instructions are required');
      expect(wrapper.text()).toContain('Template is required');
    });
  });
});
```

### Test File: `tests/use-cases/viewing-prompts.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import PromptsPage from '../pages/PromptsPage.vue';
import { PromptService } from '../services/PromptService';
import { MockPromptRepository } from '../repositories/MockPromptRepository';
import { createPromptsStore } from '../store/PromptsStore';
import { mockData } from '../PromptMockData';

// Mock bootstrap to ensure test isolation
vi.mock('../bootstrap', () => {
  const repository = new MockPromptRepository();
  const service = new PromptService(repository);
  const store = createPromptsStore(service);
  
  return {
    bootstrapPrompts: () => ({
      useStore: store,
      routes: [],
    }),
  };
});

describe('Viewing Prompts', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('As a user, I can view all my prompts', () => {
    it('should display all prompts when I open the page', async () => {
      // Given: User navigates to prompts page
      const wrapper = mount(PromptsPage);
      
      // When: Page loads
      await new Promise(resolve => setTimeout(resolve, 100));
      await wrapper.vm.$nextTick();

      // Then: All prompts are displayed
      expect(wrapper.text()).toContain(mockData.prompts[0].title);
      expect(wrapper.text()).toContain(mockData.prompts[1].title);
    });

    it('should show empty state when I have no prompts', async () => {
      // Given: Repository has no prompts
      // Override the mock to use an empty repository
      vi.mocked(await import('../bootstrap')).bootstrapPrompts = () => {
        const emptyRepository = new MockPromptRepository([]);
        const service = new PromptService(emptyRepository);
        const store = createPromptsStore(service);
        return {
          useStore: store,
          routes: [],
        };
      };
      
      // When: User opens page
      const wrapper = mount(PromptsPage);
      await new Promise(resolve => setTimeout(resolve, 100));
      await wrapper.vm.$nextTick();

      // Then: Empty state is shown
      expect(wrapper.text()).toContain('No prompts found');
    });

    it('should show loading state while fetching prompts', async () => {
      // This test would require more sophisticated mocking to control async timing
      // Implementation depends on specific requirements
    });
  });
});
```

## Test Data Management

### Mock Data File: `tests/<Feature>MockData.ts`

```typescript
export const mockData = {
  prompts: [
    {
      id: '1',
      title: 'Design a new feature',
      instructions: 'Design a new feature for the product',
      template: 'Design a new feature for the product',
      category: 'design/features',
      tags: ['design', 'features', 'shared']
    },
    {
      id: '2',
      title: 'Design a new user interface',
      instructions: 'Design a new user interface for the product',
      template: 'Design a new user interface for the product',
      category: 'design/ui',
      tags: ['design', 'ui', 'shared']
    }
  ]
};
```

### Using Mock Data in Tests

```typescript
import { mockData } from './PromptMockData';
import { Prompt } from '../entities/Prompt';

// Convert to domain entities
const prompts = mockData.prompts.map(p => Prompt.fromPlainObject(p));

// Use in repository
const repository = new MockPromptRepository(prompts);
```

## Best Practices

### 1. Test User Workflows, Not Implementation

❌ **Bad**: "Component calls store.fetchPrompts()"

✅ **Good**: "User can view all prompts when opening the page"

### 2. Use Descriptive Test Names

❌ **Bad**: `it('works correctly', ...)`

✅ **Good**: `it('should create and display a prompt after filling the form', ...)`

### 3. Organize by Use Case

❌ **Bad**: `PromptsList.test.ts`, `PromptsStore.test.ts`

✅ **Good**: `viewing-prompts.test.ts`, `creating-prompts.test.ts`

### 4. Test Complete Flows

Test the entire user journey:

- User action → UI update → Store state → Service call → Repository → Result

### 5. Keep Tests Independent

Each test should:

- Set up its own state
- Not depend on other tests
- Clean up after itself (if needed)

### 6. Use Real Stack

- Real components (not mocked)
- Real store (not mocked)
- Real service (not mocked)
- Mock repository only (the boundary)

## Test Isolation and Reducing Flakiness

### Critical Rules for Test Isolation

1. **Always Mock Bootstrap at Top Level**

   ```typescript
   // ✅ GOOD: Mock at top level before any imports
   vi.mock('../bootstrap', () => { /* ... */ });
   
   import PromptsPage from '../pages/PromptsPage.vue';
   ```

   ```typescript
   // ❌ BAD: Mocking inside beforeEach creates shared state
   beforeEach(() => {
     vi.mock('../bootstrap', () => { /* ... */ }); // Won't work correctly
   });
   ```

2. **Create Fresh Store Instance Per Test**

   The bootstrap mock creates a store factory, but each test should get a fresh instance:

   ```typescript
   vi.mock('../bootstrap', () => {
     // Create factory function, not instance
     return {
       bootstrapPrompts: () => {
         // Fresh instance for each call
         const repository = new MockPromptRepository();
         const service = new PromptService(repository);
         const store = createPromptsStore(service);
         return { useStore: store, routes: [] };
       },
     };
   });
   ```

3. **Reset Pinia Between Tests**

   ```typescript
   beforeEach(() => {
     setActivePinia(createPinia()); // Fresh Pinia instance
   });
   ```

4. **Use Fresh Repository Data Per Test**

   ```typescript
   // ✅ GOOD: Each test gets its own repository instance
   vi.mock('../bootstrap', () => {
     return {
       bootstrapPrompts: () => {
         const repository = new MockPromptRepository(); // Fresh data
         // ...
       },
     };
   });
   ```

   ```typescript
   // ❌ BAD: Shared repository instance
   const sharedRepository = new MockPromptRepository();
   vi.mock('../bootstrap', () => {
     return {
       bootstrapPrompts: () => {
         // Uses shared instance - state leaks between tests!
         const service = new PromptService(sharedRepository);
         // ...
       },
     };
   });
   ```

5. **Avoid Shared State in Mocks**

   ```typescript
   // ✅ GOOD: No shared variables
   vi.mock('../bootstrap', () => {
     return {
       bootstrapPrompts: () => {
         const repository = new MockPromptRepository(); // Created fresh
         // ...
       },
     };
   });
   ```

   ```typescript
   // ❌ BAD: Shared state
   let sharedStore; // State leaks between tests!
   vi.mock('../bootstrap', () => {
     if (!sharedStore) {
       sharedStore = createPromptsStore(/* ... */);
     }
     return {
       bootstrapPrompts: () => ({ useStore: sharedStore }),
     };
   });
   ```

6. **Wait for Async Operations Properly**

   ```typescript
   // ✅ GOOD: Wait for Vue updates and async operations
   await wrapper.vm.$nextTick();
   await new Promise(resolve => setTimeout(resolve, 0)); // For async store actions
   ```

   ```typescript
   // ❌ BAD: Not waiting for async operations
   wrapper.find('button').trigger('click');
   expect(wrapper.text()).toContain('Expected'); // May fail randomly
   ```

7. **Clean Up After Tests (If Needed)**

   ```typescript
   afterEach(() => {
     // Only if you have global state that needs cleanup
     // Most tests don't need this with proper isolation
   });
   ```

### Common Flakiness Causes

1. **Shared Singleton State**: Using `appDependencies` without mocking bootstrap
2. **Shared Store Instances**: Reusing store instances between tests
3. **Timing Issues**: Not waiting for async operations or Vue updates
4. **Test Order Dependencies**: Tests that depend on previous test state
5. **Global State Leaks**: Modifying global objects that persist between tests

### Isolation Checklist

Before writing a test, ensure:

- [ ] Bootstrap is mocked at the top level (not in `beforeEach`)
- [ ] Each test gets a fresh Pinia instance (`setActivePinia(createPinia())`)
- [ ] Each test gets a fresh repository instance
- [ ] No shared variables in mock setup
- [ ] Async operations are properly awaited
- [ ] Tests don't depend on execution order
- [ ] No global state modifications

## What NOT to Test

### Don't Test These in Integration Tests

- **Component rendering details** (unless critical for UX)
- **Store state structure** (tested via user workflows)
- **Service method signatures** (tested in unit tests)
- **Internal implementation details**

### Separate Concerns

- **Unit tests** (`<Service>.test.ts`): Test service logic with mock repositories
- **Integration tests** (`use-cases/`): Test user workflows with real stack
- **E2E tests** (external): Test full application in real browser

## Tools and Configuration

### Required Dependencies

- **Vitest**: Test runner
- **@vue/test-utils**: Vue component testing utilities
- **jsdom**: DOM environment for tests
- **Pinia**: State management (real instance in tests)

### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
  },
})
```

## Writing Tests for New Features

### Step-by-Step Process

1. **Identify User Stories**: Review feature documentation (`domains/<feature>/docs/README.md`)
2. **Extract Acceptance Criteria**: List what "done" means for each story
3. **Create Use Case Test Files**: One file per major use case
4. **Set Up Test Environment**: Mock bootstrap with real stack + mock repository
5. **Write Workflow Tests**: Test complete user journeys
6. **Add Edge Cases**: Test error states, validation, empty states

### Example: New Feature "Invoices"

```text
domains/invoices/tests/
├── InvoiceService.test.ts           # Unit tests
├── InvoiceMockData.ts               # Test data
└── use-cases/
    ├── viewing-invoices.test.ts     # Browse invoices
    ├── creating-invoices.test.ts   # Create invoice
    ├── editing-invoices.test.ts     # Edit invoice
    └── discounting-items.test.ts   # Apply discount (business process)
```

## Alignment with Architecture

This testing approach aligns with our Flat Clean Architecture:

- **Domain Layer**: Entities validated in unit tests
- **Data Layer**: Repositories mocked at boundary
- **Application Layer**: Services tested in unit tests
- **Presentation Layer**: Components tested via integration tests

The integration tests verify that all layers work together correctly, which is the primary goal: ensuring features work for users.

## Summary

- **Test business processes**, not technical details
- **Use real stack** (components + store + service) with **mock repository**
- **Organize by use case**, not by component
- **Focus on user workflows** from acceptance criteria
- **Keep tests independent** and maintainable
- **Separate unit tests** (service layer) from **integration tests** (use cases)

This approach ensures tests provide real value: confidence that features work for users, not just that code executes.
