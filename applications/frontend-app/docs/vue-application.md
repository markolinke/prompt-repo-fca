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

### Pages vs Components

**This distinction has been created for clarity** to separate route-level components from reusable feature components.

- **Pages** (`domains/<feature>/pages/`): Route-level components that are directly referenced in `routes.ts` files. These are top-level orchestration components that compose multiple smaller components together. Pages handle routing concerns and are the entry points for specific routes.
  - Examples: `NotesPage.vue`, `LoginPage.vue`
  - These are imported directly in route definitions: `component: () => import('@/domains/<feature>/pages/<PageName>.vue')`

- **Components** (`domains/<feature>/components/`): Reusable, feature-specific components that are composed by pages or other components. These components are not directly referenced in routes but are imported and used within pages.
  - Examples: `NotesList.vue`, `NoteDetails.vue`
  - These are imported by pages or other components: `import NotesList from '../components/NotesList.vue'`

- **Reusable UI components** (`src/common/ui/`): Shared UI components used across multiple features (e.g., `ButtonWithLoader.vue`, `Card.vue`, `Input.vue`)

- File naming: **PascalCase** for `.vue` files (e.g., `NotesList.vue`, `NotesPage.vue`)

**Rule of thumb**: If a component is directly referenced in `routes.ts`, it belongs in `pages/`. Otherwise, it belongs in `components/`.

## Rules for Writing Component Code

### 1. Script Setup Block

Always use:

```html
<script setup lang="ts">
```

Order: **script** block first, then **template**, then (if ever needed) **style**.

Inside `<script setup>`:

- Import from feature barrel only (`@/domains/<feature>`)
- Use explicit property access (no object destructuring)
- Call lifecycle hooks when needed (e.g., `onMounted`)
- Prefer computed state in Pinia stores over local computed properties

#### Store Integration (Mandatory Pattern)

```typescript
import { bootstrapNotes } from '@/domains/notes'
import { onMounted } from 'vue'

const bootstrapResult = bootstrapNotes()
const useNotesStore = bootstrapResult.useStore

const notesStore = useNotesStore()

// Fetch data on mount (standard pattern – placeholder for refinement)
onMounted(() => {
  notesStore.fetchNotes()
})
```

**Never** use `storeToRefs`. Access store state directly with store prefix:

```vue
<ul>
  <li v-for="note in notesStore.notes" :key="note.id">
    {{ note.title }}
  </li>
</ul>

<div v-if="notesStore.loading">Loading...</div>
<div v-if="notesStore.error">Error: {{ notesStore.error }}</div>
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
- Use store-prefixed state access (e.g., `notesStore.notes`)
- Standard structure for loading/error/empty states (placeholder – to be defined)

```vue
<template>
  <div class="p-6">
    <!-- Loading / Error / Empty states – pattern TBD -->
    
    <ul v-else class="space-y-4">
      <li
        v-for="note in notesStore.notes"
        :key="note.id"
        class="border border-gray-300 rounded-lg p-4"
      >
        <h3 class="text-lg font-bold">{{ note.title }}</h3>
        <p class="text-sm text-gray-600">{{ note.instructions }}</p>
      </li>
    </ul>
  </div>
</template>
```

### 3. Style Block

**Never** use `<style scoped>`.  
We rely exclusively on Tailwind utility classes applied directly in templates.

## Routing Integration

Each feature defines its routes in `domains/<feature>/routes.ts`:

```typescript
// domains/notes/routes.ts
import { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/notes',
    name: 'notes-list',
    component: () => import('./pages/NotesPage.vue'),
  },
]

export default routes
```

### Feature Bootstrap Returns Routes

```typescript
// domains/notes/bootstrap.ts (excerpt)
import notesRoutes from './routes'

const bootstrapNotes = () => {
  // ... wiring logic ...

  return {
    useStore: createNotesStore({ noteService: service }),
    routes: notesRoutes,
  }
}

export { bootstrapNotes }
```

### Central App Wiring (Placeholder)

All feature routes are registered in a single dedicated file using an **arrow function expression** assigned to a `const`.

File: `src/app/bootstrap.ts`

```typescript
// src/app/bootstrap/bootstrapFeatures.ts
import { Router } from 'vue-router'
import { bootstrapNotes } from '@/domains/notes'

export const bootstrapFeatures = (router: Router): void => {
  for (const route of bootstrapNotes().routes) {
    router.addRoute(route)
  }
}
```

Usage in `src/main.ts`:

```typescript
import { bootstrapFeatures } from './app/bootstrap'
import router from './router'

bootstrapFeatures(router)

app.use(router)
```

### Conventions & Rules

- Always use named routes
- Use **arrow function expression** (`const name = (...) => {}`) for the central bootstrap function.
- Prefer `for...of` loops when registering routes for maximum clarity.
- New features are added by:
  1. Importing their bootstrap
  2. Adding a `for...of` block to register their routes
- Route components should be lazy-loaded when appropriate:

  ```typescript
  component: () => import('./pages/NotesPage.vue')
  ```

- Features may define flat or nested routes as needed. No global root layout route is required unless decided later.

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

- No object destructuring (e.g., `{ useStore: useNotesStore } = ...`)
- No `<style scoped>`
- No direct store imports – always via feature bootstrap
- No `storeToRefs`
- No business logic or data access
- No Options API or mixins
- No Tailwind `@apply` or custom CSS outside utilities

## Examples

### Minimal Notes List View

```vue
<script setup lang="ts">
import { bootstrapNotes } from '@/domains/notes'
import { onMounted } from 'vue'

const bootstrapResult = bootstrapNotes()
const useNotesStore = bootstrapResult.useStore
const notesStore = useNotesStore()

onMounted(() => {
  notesStore.fetchNotes()
})
</script>

<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-6">Notes</h1>
    
    <ul class="space-y-4">
      <li
        v-for="note in notesStore.notes"
        :key="note.id"
        class="border border-gray-300 rounded-lg p-4"
      >
        <h3 class="font-semibold">{{ note.title }}</h3>
      </li>
    </ul>
  </div>
</template>
```

### Feature Barrel (index.ts)

```typescript
// domains/notes/index.ts
export { bootstrapNotes } from './bootstrap'
```

This document will evolve as we refine placeholders and add new sections (slots, composables, testing, etc.). Follow these rules strictly to maintain consistency across the codebase.
