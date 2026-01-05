# Vue Component Guidelines

## Philosophy

Components are the **presentation layer** of our Flat Clean Architecture. Their sole responsibility is to render UI and handle user interactions in a declarative way. They act as the delivery mechanism for data and state managed by the Application and Data layers.

We build components this way to:

- Keep business logic entirely on the backend (or in frontend services/repositories when necessary)
- Ensure clear separation: components contain **only presentation logic** (formatting, conditional rendering, event handling)
- Maximize reusability, readability, and testability
- Minimize cognitive load by enforcing consistent, explicit patterns
- Align with feature-self-bootstrapping design: components never import stores directly

## Core Principles for Components

- **Role**: Render UI based on reactive state from Pinia stores, dispatch user actions to stores, display loading/error/empty states.
- **Boundaries**: No business rules, no data mapping, no direct HTTP calls, no complex calculations.
- **Clarity over brevity**: Optimize for explicit, readable code.
- **Reactivity**: State comes exclusively from Pinia stores accessed via feature bootstrap.
- **Composition**: Prefer small, single-responsibility components composed together.
- **Vue Version**: Vue 3 with Composition API only.

## Component Structure and Placement

- **Views** (page-level, routed components): `features/<feature>/views/`
- **Feature-specific components**: `features/<feature>/components/`
- **Reusable UI components**: `src/common/ui/` (e.g., Button.vue, Card.vue, Input.vue)
- File naming: **PascalCase** for `.vue` files (e.g., `PromptsListView.vue`)

## Rules for Writing Component Code

### 1. Script Setup Block

Always use:

```html
<script setup lang="ts">
```

Order: **script** block first, then **template**, then (if ever needed) **style**.

Inside `<script setup>`:

- Import from feature barrel only (`@/features/<feature>`)
- Use explicit property access (no object destructuring)
- Call lifecycle hooks when needed (e.g., `onMounted`)
- Prefer computed state in Pinia stores over local computed properties

#### Store Integration (Mandatory Pattern)

```typescript
import { bootstrapPrompts } from '@/features/prompts'
import { onMounted } from 'vue'

const bootstrapResult = bootstrapPrompts()
const usePromptsStore = bootstrapResult.useStore

const promptsStore = usePromptsStore()

// Fetch data on mount (standard pattern – placeholder for refinement)
onMounted(() => {
  promptsStore.fetchPrompts()
})
```

**Never** use `storeToRefs`. Access store state directly with store prefix:

```vue
<ul>
  <li v-for="prompt in promptsStore.prompts" :key="prompt.id">
    {{ prompt.title }}
  </li>
</ul>

<div v-if="promptsStore.loading">Loading...</div>
<div v-if="promptsStore.error">Error: {{ promptsStore.error }}</div>
```

#### Props and Emits (Placeholder – to be refined)

```typescript
// TBD: final decision on defineProps / defineEmits macros vs runtime declaration
```

#### Lifecycle Hooks

Use standard Vue lifecycle hooks as needed:

```typescript
import { onMounted, onUnmounted } from 'vue'

onMounted(() => { /* ... */ })
onUnmounted(() => { /* ... */ })
```

### 2. Template Block

- Use Tailwind CSS utility classes **directly** in the template
- Keep markup declarative and readable
- Use store-prefixed state access (e.g., `promptsStore.prompts`)
- Standard structure for loading/error/empty states (placeholder – to be defined)

```vue
<template>
  <div class="p-6">
    <!-- Loading / Error / Empty states – pattern TBD -->
    
    <ul v-else class="space-y-4">
      <li
        v-for="prompt in promptsStore.prompts"
        :key="prompt.id"
        class="border border-gray-300 rounded-lg p-4"
      >
        <h3 class="text-lg font-bold">{{ prompt.title }}</h3>
        <p class="text-sm text-gray-600">{{ prompt.instructions }}</p>
      </li>
    </ul>
  </div>
</template>
```

### 3. Style Block

**Never** use `<style scoped>`.  
We rely exclusively on Tailwind utility classes applied directly in templates.

## Routing Integration

Each feature defines its routes in `features/<feature>/routes.ts`:

```typescript
// features/prompts/routes.ts
import { RouteRecordRaw } from 'vue-router'
import PromptsListView from './views/PromptsListView.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/prompts',
    name: 'prompts-list',
    component: PromptsListView,
  },
]

export default routes
```

### Feature Bootstrap Returns Routes

```typescript
// features/prompts/bootstrap.ts (excerpt)
import promptsRoutes from './routes'

const bootstrapPrompts = () => {
  // ... wiring logic ...

  return {
    useStore: createPromptsStore({ promptService: service }),
    routes: promptsRoutes,
  }
}

export { bootstrapPrompts }
```

### Central App Wiring (Placeholder)

```typescript
// TBD: final decision on where and how to aggregate feature bootstraps
// and add routes to the router instance
```

## Props, Emits, Slots, provide/inject (Placeholders)

- Props validation and defaults: define only as needed – avoid overengineering
- Emits: always use `defineEmits` for readability (final pattern TBD)
- Slots: named vs default, fallback content – examples and decisions TBD
- provide/inject usage – decision TBD

## Error Handling, Loading States, UX Patterns (Placeholder)

Standard patterns for loading, error, empty states, global error handling, and toast notifications are **not yet defined**.

## Testing Components

- Tools: **Vitest** + **@testing-library/vue**
- Mocking strategy: always mock at repository level via bootstrap options
- Test placement and conventions: TBD

## Accessibility, Performance, and Other Best Practices (Placeholder)

- Accessibility requirements (ARIA, keyboard navigation, etc.): TBD
- Performance optimizations (v-memo, keep-alive, lazy loading): TBD
- Forbidden Vue features: **No Options API**, **no mixins**

## What NOT to Do

- No object destructuring (e.g., `{ useStore: usePromptsStore } = ...`)
- No `<style scoped>`
- No direct store imports – always via feature bootstrap
- No `storeToRefs`
- No business logic or data access
- No Options API or mixins
- No Tailwind `@apply` or custom CSS outside utilities

## Examples

### Minimal Prompts List View

```vue
<script setup lang="ts">
import { bootstrapPrompts } from '@/features/prompts'
import { onMounted } from 'vue'

const bootstrapResult = bootstrapPrompts()
const usePromptsStore = bootstrapResult.useStore
const promptsStore = usePromptsStore()

onMounted(() => {
  promptsStore.fetchPrompts()
})
</script>

<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-6">Prompts</h1>
    
    <ul class="space-y-4">
      <li
        v-for="prompt in promptsStore.prompts"
        :key="prompt.id"
        class="border border-gray-300 rounded-lg p-4"
      >
        <h3 class="font-semibold">{{ prompt.title }}</h3>
      </li>
    </ul>
  </div>
</template>
```

### Feature Barrel (index.ts)

```typescript
// features/prompts/index.ts
export { bootstrapPrompts } from './bootstrap'
```

This document will evolve as we refine placeholders and add new sections (slots, composables, testing, etc.). Follow these rules strictly to maintain consistency across the codebase.