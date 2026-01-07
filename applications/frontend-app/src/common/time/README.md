# Time Utilities Module

This module provides timeout and debouncing utilities for the application, following clean architecture principles with dependency injection and testability in mind.

## Overview

The `common/time` module provides:

- **TimeoutPort**: An abstraction for timeout operations (allows dependency injection)
- **BrowserTimeout**: Production implementation using `window.setTimeout`
- **createDebouncer**: A reusable debouncing utility
- **MockTimeout**: Test implementation with manual time control
- **createTestDebouncer**: Test helper for creating debouncers with mock time

## Architecture

The module follows the **Port and Adapter** pattern:

- **Port**: `TimeoutPort` interface defines the contract
- **Adapters**: `BrowserTimeout` (production) and `MockTimeout` (testing)
- **Utilities**: `createDebouncer` works with any `TimeoutPort` implementation

This design enables:

- ✅ Dependency injection for testability
- ✅ Framework-agnostic core (no Vue/Pinia dependencies)
- ✅ Manual time control in tests (no real delays)

## Usage in Components

### Example: PromptsPage.vue

Components obtain the debouncer through their domain's bootstrap function:

```vue
<script setup lang="ts">
import { bootstrapPrompts } from '../bootstrap';

const bootstrap = bootstrapPrompts();
const promptsStore = bootstrap.useStore();
const searchDebouncer = bootstrap.createSearchDebouncer();

const searchQuery = ref('');

const handleSearch = () => {
  searchDebouncer(() => {
    promptsStore.searchPrompts(searchQuery.value);
  });
};
</script>

<template>
  <input 
    v-model="searchQuery" 
    @input="handleSearch" 
    placeholder="Search prompts" 
  />
</template>
```

**Key Points:**

- Components **never** import directly from `common/time`
- Debouncer is obtained via domain bootstrap (dependency injection)
- The debouncer automatically cancels previous calls when new ones arrive
- Default delay is 500ms (configurable in bootstrap)

## Usage in Testing

### Example: filtering-prompts.test.ts

Tests use `MockTimeout` to control time manually, making tests fast and deterministic:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { mockBootstrapPrompts, mockTimeout } from '../testHelpers';

mockBootstrapPrompts(); // Must be called before importing components

import PromptsPage from '../../pages/PromptsPage.vue';

describe('Filtering Prompts', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockTimeout.reset(); // Reset for test isolation
  });

  it('should filter prompts after debounce delay', async () => {
    const wrapper = mount(PromptsPage);
    await flushPromises();
    await wrapper.vm.$nextTick();

    // User types in search input
    const searchInput = wrapper.find('[data-testid="search-input"]');
    await searchInput.setValue('Design');

    // Option 1: Use runAll() for behavior-focused tests
    mockTimeout.runAll(); // Executes all scheduled callbacks immediately
    await flushPromises(); // Wait for async store actions
    await wrapper.vm.$nextTick(); // Wait for Vue reactivity

    // Option 2: Use advanceBy() for timing-specific tests
    mockTimeout.advanceBy(499); // Advance by less than delay
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.findAll('[data-testid="prompt-item"]').length).toBe(4); // Still unfiltered

    mockTimeout.advanceBy(1); // Complete the delay
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.findAll('[data-testid="prompt-item"]').length).toBe(2); // Filtered
  });
});
```

**Key Points:**

- `mockTimeout.runAll()` - Executes all callbacks immediately (good for behavior tests)
- `mockTimeout.advanceBy(ms)` - Advances virtual time (good for timing tests)
- Always use `flushPromises()` after triggering time to wait for async operations
- Always use `$nextTick()` after `flushPromises()` to wait for Vue reactivity
- Reset `mockTimeout` in `beforeEach` for test isolation

## Production Bootstrapping

### Example: domains/prompts/bootstrap.ts

Domain bootstraps create debouncers using the common utility and inject the timeout client:

```typescript
import { appDependencies } from "@/common/env/AppDependencies";
import { createDebouncer } from '@/common/time/Debouncer';

const bootstrapPrompts = () => {
    const timeoutClient = appDependencies.getTimeoutClient(); // Gets BrowserTimeout
    
    const createSearchDebouncer = () => {
        return createDebouncer(timeoutClient, 500); // 500ms delay
    }
  
    return {
        useStore: createPromptsStore(service),
        routes: promptsRoutes,
        createSearchDebouncer // Exposed to components
    }
}

export { bootstrapPrompts }
```

**Key Points:**

- Timeout client comes from `AppDependencies` (injected during app bootstrap)
- `createDebouncer` is imported from `common/time/Debouncer`
- Delay is configurable per domain (500ms in this example)
- Bootstrap returns a factory function that creates fresh debouncers

## Test Bootstrapping

### Example: domains/prompts/tests/testHelpers.ts

Test helpers create debouncers using `MockTimeout` for manual control:

```typescript
import { createTestDebouncer } from '@/common/time/tests/DebouncerTestHelper';

/**
 * Mock timeout instance and debouncer used in tests.
 * Tests can use mockTimeout.advanceBy(ms) or mockTimeout.runAll() 
 * to control when callbacks execute.
 */
export const { debouncer: mockSearchDebouncer, mockTimeout } = createTestDebouncer();

export const mockBootstrapPrompts = () => {
  vi.mock('../bootstrap', () => {
    return {
      bootstrapPrompts: () => {
        const store = createPromptsStore(service);

        const createSearchDebouncer = () => {
          return mockSearchDebouncer; // Uses MockTimeout internally
        };

        return {
          useStore: store,
          routes: [],
          createSearchDebouncer,
        };
      },
    };
  });
};
```

**Key Points:**

- `createTestDebouncer()` returns both the debouncer and `mockTimeout` instance
- The mock debouncer uses `MockTimeout` instead of real timers
- Tests can control time via `mockTimeout.advanceBy()` or `mockTimeout.runAll()`
- Same API as production, but with testable time control

## API Reference

### `createDebouncer(timeoutClient, delayMs?)`

Creates a debounced function that delays execution until after the specified delay.

**Parameters:**

- `timeoutClient: TimeoutPort` - The timeout implementation to use
- `delayMs: number` - Delay in milliseconds (default: 500)

**Returns:**

- `(callback: () => void) => void` - A debounced function

**Behavior:**

- Multiple rapid calls cancel previous pending calls
- Only the last call executes after the delay period
- Each call resets the timer

### `createTestDebouncer(mockTimeout?, delayMs?)`

Creates a debouncer for testing with manual time control.

**Parameters:**

- `mockTimeout: MockTimeout` - Optional MockTimeout instance (default: new instance)
- `delayMs: number` - Delay in milliseconds (default: 500)

**Returns:**

- `{ debouncer: Function, mockTimeout: MockTimeout }` - Debouncer and timeout control

### `MockTimeout`

Test implementation of `TimeoutPort` with manual time control.

**Methods:**

- `setTimeout(callback, delay): TimeoutHandle` - Schedule a callback
- `clearTimeout(handle): void` - Cancel a scheduled callback
- `advanceBy(ms): void` - Advance virtual time and execute due callbacks
- `runAll(): void` - Execute all scheduled callbacks immediately
- `reset(): void` - Reset to initial state (for test isolation)

### `BrowserTimeout`

Production implementation using `window.setTimeout`.

**Methods:**

- `setTimeout(callback, delay): TimeoutHandle` - Delegates to `window.setTimeout`
- `clearTimeout(handle): void` - Delegates to `window.clearTimeout`

## Best Practices

### Choosing `runAll()` vs `advanceBy()`

- **Use `runAll()`** for behavior-focused tests (filtering logic, empty states):

  - Faster and simpler
  - Tests what matters, not timing
  - Decoupled from delay constant

- **Use `advanceBy(ms)`** for timing-specific tests (debounce delay verification):

  - Tests that delay is respected
  - Can test partial delays (e.g., 499ms shouldn't trigger)
  - More realistic simulation

### Test Pattern

Always follow this pattern after triggering time:

```typescript
mockTimeout.runAll(); // or advanceBy(ms)
await flushPromises(); // Wait for async operations (store actions)
await wrapper.vm.$nextTick(); // Wait for Vue reactivity
// Now assert
```

### Test Isolation

Always reset `mockTimeout` in `beforeEach`:

```typescript
beforeEach(() => {
  mockTimeout.reset();
});
```

## Design Principles

1. **Dependency Injection**: Components receive debouncers via bootstrap, never import directly
2. **Framework Agnostic**: Core utilities have no Vue/Pinia dependencies
3. **Testability First**: Everything is mockable and controllable in tests
4. **Single Responsibility**: Time utilities live in `common/time`, not in domains
5. **Reusability**: Any domain can use the debouncer without duplication

## See Also

- `common/env/AppDependencies.ts` - Dependency injection container
- `app/bootstrap/bootstrapDependencies.ts` - App-level dependency registration
- Domain-specific bootstrap files (e.g., `domains/prompts/bootstrap.ts`)
- Domain-specific test helpers (e.g., `domains/prompts/tests/testHelpers.ts`)
