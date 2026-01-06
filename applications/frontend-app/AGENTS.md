# AI Agent Guidelines for Frontend Application

This document provides essential guidance for AI agents working on this codebase. It complements the detailed documentation in `docs/` and focuses on practical patterns, rules, and common tasks.

## Quick Start: Understanding the Architecture

This project follows **Flat Clean Architecture** with **Feature-Sliced Design** principles:

- **Domains** (`src/domains/`) are self-contained feature modules
- Each domain has its own: entities, repositories, services, store, components, pages
- **Common layer** (`src/common/`) provides framework-agnostic infrastructure
- **App layer** (`src/app/`) handles Vue app initialization and bootstrapping

**Critical Rule**: Dependencies flow inward: Components → Stores → Services → Repositories → HTTP Client

## Essential Documentation References

Before making changes, review these files in `docs/`:

1. **[architecture.md](./docs/architecture.md)** - Overall structure and principles
2. **[domain-core-layers.md](./docs/domain-core-layers.md)** - Entities, Repositories, Services patterns
3. **[frontend-store.md](./docs/frontend-store.md)** - Pinia store guidelines
4. **[vue-application.md](./docs/vue-application.md)** - Vue component patterns
5. **[common-layer.md](./docs/common-layer.md)** - Infrastructure layer rules

## Critical Rules (DO NOT VIOLATE)

### 1. Dependency Flow Rules

- ✅ **Components** can only import from: feature bootstrap, Vue, Tailwind classes
- ✅ **Stores** can only call injected **Services** (never repositories directly)
- ✅ **Services** depend on **Repository Ports** (interfaces), not implementations
- ✅ **Repositories** use `HttpClientPort` from `common/http/`
- ❌ **NEVER** make HTTP calls from components, stores, or services
- ❌ **NEVER** import stores directly - always via feature bootstrap
- ❌ **NEVER** put business logic in components or stores

### 2. Feature Bootstrap Pattern (MANDATORY)

Every domain **MUST** export a `bootstrap<Feature>()` function from its `index.ts`:

```typescript
// domains/prompts/bootstrap.ts
const bootstrapPrompts = () => {
    const useMocks = appDependencies.getAppConfig().isMockEnv
    const apiClient = appDependencies.getHttpClient()
    const repository = useMocks
        ? new MockPromptRepository()
        : new HttpPromptRepository(apiClient)
    const service = new PromptService(repository)
    
    return {
        useStore: createPromptsStore(service),
        routes: promptsRoutes
    }
}
```

### 3. Component Pattern (MANDATORY)

Components **MUST** use feature bootstrap to access stores:

```vue
<script setup lang="ts">
import { bootstrapPrompts } from '@/domains/prompts'
import { onMounted } from 'vue'

const bootstrap = bootstrapPrompts()
const promptsStore = bootstrap.useStore()

onMounted(() => {
  promptsStore.fetchPrompts()
})
</script>
```

**Never** do:
- ❌ `import { usePromptsStore } from '@/domains/prompts/store/PromptsStore'`
- ❌ Direct store imports
- ❌ Object destructuring from bootstrap: `const { useStore } = bootstrapPrompts()`

### 4. Store Factory Pattern (MANDATORY)

Stores **MUST** be created via factory functions:

```typescript
// domains/prompts/store/PromptsStore.ts
type PromptServiceShape = {
    getPrompts(): Promise<Prompt[]>
    // ... other methods
}

export const createPromptsStore = (promptService: PromptServiceShape) => {
    return defineStore('prompts', {
        state: () => ({ /* ... */ }),
        actions: {
            async fetchPrompts() {
                this.prompts = await promptService.getPrompts()
            }
        }
    })
}
```

### 5. Repository Port Pattern (MANDATORY)

Every repository **MUST** have a port interface:

```typescript
// domains/prompts/repositories/PromptRepositoryPort.ts
export interface PromptRepositoryPort {
    getPrompts(): Promise<Prompt[]>
    getPromptById(id: string): Promise<Prompt>
    // ... other methods
}
```

Provide both `Http<Feature>Repository` and `Mock<Feature>Repository` implementations.

### 6. Entity Validation Pattern

Entities **MUST** validate in constructors and provide `fromPlainObject`:

```typescript
// domains/prompts/entities/Prompt.ts
export class Prompt {
    constructor(/* params */) {
        this.validate(/* params */)
        // assign properties
    }
    
    static fromPlainObject(data: {...}): Prompt {
        return new Prompt(/* ... */)
    }
    
    private validate(/* params */): void {
        // throw ValidationError on failure
    }
}
```

### 7. Common Layer Rules

- **NEVER** import from domains or app in `common/`
- **ONLY** plain TypeScript (no Vue, Pinia, DOM APIs)
- Use `AppDependencies` singleton for global dependencies
- All HTTP calls go through `HttpClientPort`

## Common Tasks & Patterns

### Adding a New Domain/Feature

1. Create domain folder: `src/domains/<feature-name>/`
2. Create structure:
   ```
   domains/<feature>/
   ├── entities/
   ├── repositories/
   │   ├── <Feature>RepositoryPort.ts
   │   ├── Http<Feature>Repository.ts
   │   └── Mock<Feature>Repository.ts
   ├── services/
   │   └── <Feature>Service.ts
   ├── store/
   │   └── <Feature>Store.ts
   ├── components/
   ├── pages/
   ├── routes.ts
   ├── bootstrap.ts
   ├── index.ts
   └── tests/
   ```
3. Implement bootstrap function
4. Export from `index.ts`: `export { bootstrap<Feature> } from './bootstrap'`
5. Register in `src/app/bootstrap/bootstrapFeatures.ts`

### Adding a New Repository Method

1. Add method to port interface: `domains/<feature>/repositories/<Feature>RepositoryPort.ts`
2. Implement in `Http<Feature>Repository.ts`
3. Implement in `Mock<Feature>Repository.ts`
4. Add to service: `domains/<feature>/services/<Feature>Service.ts`
5. Add to store actions if needed
6. Update store service shape type

### Adding a New Component

1. Place in `domains/<feature>/components/` or `domains/<feature>/pages/`
2. Use PascalCase: `MyComponent.vue`
3. Follow component pattern (bootstrap → store)
4. Use Tailwind classes only (no `<style scoped>`)
5. Use `<script setup lang="ts">` only

### Adding a New Route

1. Add to `domains/<feature>/routes.ts`:
   ```typescript
   {
     path: '/my-route',
     name: 'my-route',
     component: () => import('./pages/MyPage.vue')
   }
   ```
2. Routes are automatically registered via bootstrap

### Error Handling

- Use errors from `common/errors/DomainError.ts` for generic errors
- Feature-specific errors go in the feature (entities or repositories)
- Services propagate errors (don't wrap unless adding context)
- Stores catch errors and set `error` state

### Testing Patterns

- Tests colocated in `domains/<feature>/tests/`
- Use Vitest
- Test services with mock repositories
- Test stores with real services + mock repositories
- Mock data helpers in `tests/<Feature>MockData.ts`

## Code Examples from Codebase

### Complete Feature Bootstrap
See: `src/domains/prompts/bootstrap.ts`

### Complete Store Factory
See: `src/domains/prompts/store/PromptsStore.ts`

### Complete Component
See: `src/domains/prompts/pages/PromptsPage.vue`

### Complete Service
See: `src/domains/prompts/services/PromptService.ts`

### Complete Entity
See: `src/domains/prompts/entities/Prompt.ts`

## File Naming Conventions

- **Components**: PascalCase (e.g., `PromptsList.vue`)
- **Entities**: PascalCase (e.g., `Prompt.ts`)
- **Services**: PascalCase (e.g., `PromptService.ts`)
- **Repositories**: PascalCase (e.g., `HttpPromptRepository.ts`)
- **Ports**: PascalCase with `Port` suffix (e.g., `PromptRepositoryPort.ts`)
- **Stores**: PascalCase (e.g., `PromptsStore.ts`)
- **Bootstrap**: camelCase (e.g., `bootstrap.ts`)
- **Routes**: camelCase (e.g., `routes.ts`)

## Import Path Conventions

- Use `@/` alias for `src/` root
- Feature imports: `@/domains/<feature>`
- Common imports: `@/common/<module>`
- App imports: `@/app/<module>`

## What NOT to Do

❌ **Never**:
- Make HTTP calls outside repositories
- Import stores directly (use bootstrap)
- Put business logic in components/stores
- Use Options API or mixins
- Use `<style scoped>` (Tailwind only)
- Import from domains in `common/`
- Create service port files (use duck typing)
- Use `storeToRefs` (access store properties directly)
- Destructure bootstrap result: `const { useStore } = bootstrap()`

✅ **Always**:
- Use feature bootstrap for stores
- Use repository ports for data access
- Validate in entity constructors
- Provide mock repositories
- Use factory functions for stores
- Export bootstrap from `index.ts`
- Use TypeScript strict mode
- Follow dependency flow rules

## Quick Checklist for Code Changes

Before submitting changes, verify:

- [ ] Dependencies flow correctly (no circular imports)
- [ ] Feature has bootstrap function exported from `index.ts`
- [ ] Components use bootstrap to access stores
- [ ] Store uses factory pattern with injected service
- [ ] Repository has port interface
- [ ] Both HTTP and Mock repository implementations exist
- [ ] Entity validates in constructor
- [ ] No HTTP calls outside repositories
- [ ] No business logic in components/stores
- [ ] Uses Tailwind classes (no scoped styles)
- [ ] Follows naming conventions
- [ ] Routes registered in `bootstrapFeatures.ts`

## Getting Help

1. **Architecture questions**: See `docs/architecture.md`
2. **Layer-specific questions**: See corresponding `docs/*.md`
3. **Pattern examples**: Check `src/domains/prompts/` (reference implementation)
4. **Common infrastructure**: See `src/common/` and `docs/common-layer.md`

## Key Principles Summary

1. **Separation of Concerns**: Each layer has one responsibility
2. **Dependency Inversion**: Depend on abstractions (ports), not implementations
3. **Feature Self-Sufficiency**: Each domain is a complete, bootstrappable module
4. **Framework Agnostic Core**: Entities, repositories, services are pure TypeScript
5. **Testability First**: Everything is mockable and testable
6. **Clarity Over Cleverness**: Code should be obvious to junior developers and AI agents

---

**Remember**: When in doubt, check the `prompts` domain (`src/domains/prompts/`) - it's the reference implementation for all patterns.
