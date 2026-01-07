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

- **Test Business Processes**: Test whether "creating a note" works, not whether a component renders
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
   - Example: `NoteService.test.ts`

2. **Integration Tests** (Use Case Level)
   - Test complete user workflows
   - Real components + real store + real service + mock repository
   - Located in `domains/<feature>/tests/use-cases/`
   - Example: `creating-notes.test.ts`, `viewing-notes.test.ts`

### What We Test

✅ **DO Test:**

- Complete user workflows (e.g., "user can create a note")
- Business processes end-to-end (UI → Store → Service → Repository)
- User interactions and their outcomes
- Error states and edge cases from user perspective
- Validation rules as users experience them
- **ALWAYS use `data-testid` attributes for test selectors** (see Test Selectors section below)

❌ **DON'T Test:**

- Component rendering in isolation (unless testing complex presentation logic)
- Store actions in isolation (tested via integration tests)
- Implementation details (e.g., "does component call store method X")
- Technical details that don't affect user experience
- **NEVER use CSS class selectors or HTML structure-dependent selectors in tests** (see Test Selectors section below)

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

- **Unit tests**: `<Service>.test.ts` (e.g., `NoteService.test.ts`)
- **Integration tests**: `<use-case>-<feature>.test.ts` (e.g., `creating-notes.test.ts`)
- **Test descriptions**: Use user story format (e.g., "As a user, I can create a note")

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
import NotesPage from '../pages/NotesPage.vue';
import { NoteService } from '../services/NoteService';
import { MockNoteRepository } from '../repositories/MockNoteRepository';
import { createNotesStore } from '../store/NotesStore';

// Mock bootstrap to bypass appDependencies singleton
vi.mock('../bootstrap', () => {
  const repository = new MockNoteRepository();
  const service = new NoteService(repository);
  const store = createNotesStore(service);
  
  return {
    bootstrapNotes: () => ({
      useStore: store,
      routes: [],
    }),
  };
});

describe('Creating Notes', () => {
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
import { NoteService } from '../services/NoteService';
import { MockNoteRepository } from '../repositories/MockNoteRepository';
import { createNotesStore } from '../store/NotesStore';
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
 * import NotesPage from '../pages/NotesPage.vue'; // Now safe to import
 * ```
 */
export const mockBootstrap = () => {
  vi.mock('../bootstrap', () => {
    // Return a factory that creates fresh instances for each call
    return {
      bootstrapNotes: () => {
        const repository = new MockNoteRepository();
        const service = new NoteService(repository);
        const store = createNotesStore(service);
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
export const createTestStoreWithData = (initialNotes: Note[] = []) => {
  setActivePinia(createPinia());
  
  const repository = new MockNoteRepository(initialNotes);
  const service = new NoteService(repository);
  const store = createNotesStore(service);
  
  return { repository, service, store };
};
```

## Example: Use Case-Based Integration Test

### Test File: `tests/use-cases/creating-notes.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import NotesPage from '../pages/NotesPage.vue';
import { NoteService } from '../services/NoteService';
import { MockNoteRepository } from '../repositories/MockNoteRepository';
import { createNotesStore } from '../store/NotesStore';
import { Note } from '../entities/Note';
import { mockData } from '../NoteMockData';

// Mock bootstrap to ensure test isolation
vi.mock('../bootstrap', () => {
  const repository = new MockNoteRepository();
  const service = new NoteService(repository);
  const store = createNotesStore(service);
  
  return {
    bootstrapNotes: () => ({
      useStore: store,
      routes: [],
    }),
  };
});

describe('Creating Notes', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('As a user, I can create a new note', () => {
    it('should create and display a note after filling the form', async () => {
      // Given: User is on notes page
      const wrapper = mount(NotesPage);
      
      // Wait for initial load
      await new Promise(resolve => setTimeout(resolve, 100));
      await wrapper.vm.$nextTick();
      
      const initialCount = wrapper.findAll('[data-testid="initial-count"]').length;

      // When: User clicks "Add Note" and fills the form
      const addButton = wrapper.find('[data-testid="add-button"]');
      await addButton.trigger('click');
      await wrapper.vm.$nextTick();

      // Fill form
      const noteDetails = wrapper.findComponent({ name: 'NoteDetails' });
      await noteDetails.find('[data-testid="title-field"]').setValue('New Test Note');
      await noteDetails.find('[data-testid="instructions-field"]').setValue('Test instructions');
      await noteDetails.find('[data-testid="template-field"]').setValue('Test template');
      
      // Save
      const saveButton = noteDetails.find('[data-testid="save-button"]');
      await saveButton?.trigger('click');
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));
      await wrapper.vm.$nextTick();

      // Then: The note appears in the list
      expect(wrapper.text()).toContain('New Test Note');
      expect(wrapper.findAll('[data-testid="note-item"]').length).toBe(initialCount + 1);
    });

    it('should prevent creating a note without required fields', async () => {
      // Given: User opens create form
      const wrapper = mount(NotesPage);
      await new Promise(resolve => setTimeout(resolve, 100));
      await wrapper.vm.$nextTick();
      
      const addButton = wrapper.find('fwb-button');
      await addButton.trigger('click');
      await wrapper.vm.$nextTick();

      // When: User tries to save without filling required fields
      const noteDetails = wrapper.findComponent({ name: 'NoteDetails' });
      const saveButton = noteDetails.findAll('[data-testid="save-button"]').find(
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

### Test File: `tests/use-cases/viewing-notes.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import NotesPage from '../pages/NotesPage.vue';
import { NoteService } from '../services/NoteService';
import { MockNoteRepository } from '../repositories/MockNoteRepository';
import { createNotesStore } from '../store/NotesStore';
import { mockData } from '../NoteMockData';

// Mock bootstrap to ensure test isolation
vi.mock('../bootstrap', () => {
  const repository = new MockNoteRepository();
  const service = new NoteService(repository);
  const store = createNotesStore(service);
  
  return {
    bootstrapNotes: () => ({
      useStore: store,
      routes: [],
    }),
  };
});

describe('Viewing Notes', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('As a user, I can view all my notes', () => {
    it('should display all notes when I open the page', async () => {
      // Given: User navigates to notes page
      const wrapper = mount(NotesPage);
      
      // When: Page loads
      await new Promise(resolve => setTimeout(resolve, 100));
      await wrapper.vm.$nextTick();

      // Then: All notes are displayed
      expect(wrapper.text()).toContain(mockData.notes[0].title);
      expect(wrapper.text()).toContain(mockData.notes[1].title);
    });

    it('should show empty state when I have no notes', async () => {
      // Given: Repository has no notes
      // Override the mock to use an empty repository
      vi.mocked(await import('../bootstrap')).bootstrapNotes = () => {
        const emptyRepository = new MockNoteRepository([]);
        const service = new NoteService(emptyRepository);
        const store = createNotesStore(service);
        return {
          useStore: store,
          routes: [],
        };
      };
      
      // When: User opens page
      const wrapper = mount(NotesPage);
      await new Promise(resolve => setTimeout(resolve, 100));
      await wrapper.vm.$nextTick();

      // Then: Empty state is shown
      expect(wrapper.text()).toContain('No notes found');
    });

    it('should show loading state while fetching notes', async () => {
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
  notes: [
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
import { mockData } from './NoteMockData';
import { Note } from '../entities/Note';

// Convert to domain entities
const notes = mockData.notes.map(p => Note.fromPlainObject(p));

// Use in repository
const repository = new MockNoteRepository(notes);
```

## Best Practices

### 1. Test User Workflows, Not Implementation

❌ **Bad**: "Component calls store.fetchNotes()"

✅ **Good**: "User can view all notes when opening the page"

### 2. Use Descriptive Test Names

❌ **Bad**: `it('works correctly', ...)`

✅ **Good**: `it('should create and display a note after filling the form', ...)`

### 3. Organize by Use Case

❌ **Bad**: `NotesList.test.ts`, `NotesStore.test.ts`

✅ **Good**: `viewing-notes.test.ts`, `creating-notes.test.ts`

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

### 7. Use Data Attributes for Test Selectors

**CRITICAL**: Always use `data-testid` attributes for selecting elements in tests. See the [Test Selectors](#test-selectors) section below for detailed guidance.

## Test Selectors

### Why Test Selectors Matter

Test selectors are how your tests find and interact with elements in the DOM. **Using the wrong selectors creates brittle, fragile tests that break when you refactor styling or HTML structure**, even when functionality remains unchanged.

### The Problem with CSS Class Selectors

❌ **NEVER DO THIS**:

```typescript
// ❌ BAD: Fragile - breaks when CSS classes change
const noteItems = wrapper.findAll('[class*="border-gray-200"]');
const button = wrapper.find('.btn-primary');
```

**Why this is terrible:**

- CSS classes are **styling concerns**, not semantic markers
- Classes change frequently during design iterations
- Tests break when you refactor Tailwind classes or switch CSS frameworks
- Creates tight coupling between tests and presentation layer
- Violates separation of concerns (tests depend on styling implementation)

### The Solution: Data Attributes

✅ **ALWAYS DO THIS**:

```vue
<!-- In your component template -->
<li
  v-for="note in notesStore.notes"
  :key="note.id"
  data-testid="note-item"
  class="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white px-4 py-3"
  @click="handleNoteClick(note)"
>
  <!-- content -->
</li>

<button
  data-testid="add-note-button"
  class="btn btn-primary"
  @click="handleAddNote"
>
  Add Note
</button>
```

```typescript
// In your test
const noteItems = wrapper.findAll('[data-testid="note-item"]');
const addButton = wrapper.find('[data-testid="add-note-button"]');
```

### Why Data Attributes Are Best Practice

1. **Stable and Independent**: `data-testid` attributes are **explicitly for testing** and won't change with styling
2. **Clear Intent**: Makes it obvious which elements are important for testing
3. **Framework Agnostic**: Works with Vue Test Utils, Testing Library, Playwright, etc.
4. **Industry Standard**: Recommended by Vue 3, React Testing Library, and modern testing best practices
5. **Resilient to Refactoring**: Tests survive CSS framework changes, design system updates, and styling refactors

### Naming Conventions

Use descriptive, semantic names that describe the element's purpose:

```vue
<!-- ✅ GOOD: Clear and descriptive -->
<button data-testid="submit-form-button">Submit</button>
<input data-testid="note-title-input" />
<div data-testid="note-list-container">
  <li data-testid="note-item" v-for="note in notes">
    <h3 data-testid="note-title">{{ note.title }}</h3>
  </li>
</div>

<!-- ❌ BAD: Vague or implementation-focused -->
<button data-testid="btn1">Submit</button>
<div data-testid="div-container">
```

### When to Add `data-testid` Attributes

Add `data-testid` to elements that:

- ✅ Are interacted with in tests (buttons, inputs, links)
- ✅ Are counted or verified (list items, cards, rows)
- ✅ Represent important UI states (loading indicators, error messages, empty states)
- ✅ Are part of user workflows you're testing

**Don't add `data-testid` to every element** - only those that tests need to find.

### Alternative Approaches (When Appropriate)

While `data-testid` is the primary approach, there are cases where alternatives make sense:

1. **Semantic HTML Selectors** (when structure is stable):

   ```typescript
   // ✅ OK: Using semantic HTML when structure is unlikely to change
   const listItems = wrapper.findAll('li'); // If you always use <li> for list items
   const form = wrapper.find('form');
   ```

2. **Component References** (for component testing):

   ```typescript
   // ✅ OK: Finding child components
   const noteDetails = wrapper.findComponent({ name: 'NoteDetails' });
   ```

3. **Text Content** (for user-visible content):

   ```typescript
   // ✅ OK: Testing user-visible text
   expect(wrapper.text()).toContain('No notes found');
   ```

**However**: Prefer `data-testid` when you need to:

- Count multiple instances of the same element type
- Interact with specific elements (not just any button, but "the add note button")
- Verify element presence/absence reliably

### Examples from Our Codebase

**Before (Fragile)**:

```typescript
// ❌ BAD: Depends on CSS classes
const noteItems = wrapper.findAll('[class*="border-gray-200"]');
expect(noteItems.length).toBe(allNotes.length);
```

**After (Stable)**:

```vue
<!-- In NotesList.vue -->
<li
  v-for="note in notesStore.notes"
  :key="note.id"
  data-testid="note-item"
  class="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white px-4 py-3"
>
```

```typescript
// ✅ GOOD: Uses data-testid
const noteItems = wrapper.findAll('[data-testid="note-item"]');
expect(noteItems.length).toBe(allNotes.length);
```

### Migration Checklist

When updating existing tests:

- [ ] Identify all CSS class selectors in tests
- [ ] Add `data-testid` attributes to corresponding template elements
- [ ] Update test selectors to use `data-testid`
- [ ] Verify tests still pass
- [ ] Consider if semantic HTML selectors are appropriate (use sparingly)

### Summary: Test Selector Rules

✅ **DO:**

- Use `data-testid` attributes for test selectors
- Use descriptive, semantic names
- Add `data-testid` to elements that tests interact with or verify
- Use semantic HTML selectors only when structure is stable and unlikely to change
- Use component references for finding child components

❌ **DON'T:**

- Use CSS class selectors (`[class*="..."]`, `.btn-primary`, etc.)
- Use HTML structure-dependent selectors that break on refactoring
- Use IDs for styling (IDs should be for form labels, not test selectors)
- Add `data-testid` to every element (only those needed by tests)

**Remember**: Tests should verify **functionality**, not styling. Using `data-testid` keeps your tests focused on what matters: whether features work for users.

## Test Isolation and Reducing Flakiness

### Critical Rules for Test Isolation

1. **Always Mock Bootstrap at Top Level**

   ```typescript
   // ✅ GOOD: Mock at top level before any imports
   vi.mock('../bootstrap', () => { /* ... */ });
   
   import NotesPage from '../pages/NotesPage.vue';
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
       bootstrapNotes: () => {
         // Fresh instance for each call
         const repository = new MockNoteRepository();
         const service = new NoteService(repository);
         const store = createNotesStore(service);
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
       bootstrapNotes: () => {
         const repository = new MockNoteRepository(); // Fresh data
         // ...
       },
     };
   });
   ```

   ```typescript
   // ❌ BAD: Shared repository instance
   const sharedRepository = new MockNoteRepository();
   vi.mock('../bootstrap', () => {
     return {
       bootstrapNotes: () => {
         // Uses shared instance - state leaks between tests!
         const service = new NoteService(sharedRepository);
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
       bootstrapNotes: () => {
         const repository = new MockNoteRepository(); // Created fresh
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
       sharedStore = createNotesStore(/* ... */);
     }
     return {
       bootstrapNotes: () => ({ useStore: sharedStore }),
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
6. **Fragile Selectors**: Using CSS class selectors that break when styling changes

### Isolation Checklist

Before writing a test, ensure:

- [ ] Bootstrap is mocked at the top level (not in `beforeEach`)
- [ ] Each test gets a fresh Pinia instance (`setActivePinia(createPinia())`)
- [ ] Each test gets a fresh repository instance
- [ ] No shared variables in mock setup
- [ ] Async operations are properly awaited
- [ ] Tests don't depend on execution order
- [ ] No global state modifications
- [ ] Test selectors use `data-testid` attributes (not CSS classes)

## What NOT to Test

### Don't Test These in Integration Tests

- **Component rendering details** (unless critical for UX)
- **Store state structure** (tested via user workflows)
- **Service method signatures** (tested in unit tests)
- **Internal implementation details**
- **CSS classes or styling** (use `data-testid` for selectors, not CSS classes)

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
- **Use `data-testid` attributes for test selectors** - never use CSS class selectors

This approach ensures tests provide real value: confidence that features work for users, not just that code executes.
