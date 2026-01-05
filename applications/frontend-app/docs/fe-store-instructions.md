# Store Layer Guidelines

The `store/` layer uses **Pinia** to handle reactive state management for features. It belongs to the **Presentation** layer and acts as the "glue" between UI components/views and the **Application** layer (services). Stores manage reactive state and orchestrate UI-driven workflows but contain **no business logic**, **no data mapping**, and **no direct data access**.

## Core Principles for Stores

- **Role**: Provide reactive state, getters for derived values, and actions for orchestration. Serve as a reactive facade for the UI.
- **Boundaries**: Stores **must not** contain business rules, DTO mapping, or HTTP calls. They only call injected **application services**.
- **Reactivity**: Pinia automatically makes the entire state object reactive. **Do not** manually wrap properties with `ref()` or `reactive()`.
- **Injection**: Stores depend on the **Application layer** (`services/`) via dependency injection. They **never** depend directly on repositories or API layers.
- **Testability**: Stores are unit-tested with the real service injected with mocked repositories.
- **Size**: One store per feature. Keep lean; extract complex orchestration to services.
- **Wiring**: Stores are created via factory functions and pre-configured during **feature bootstrapping** (see architecture.md).

## Dependency Injection Strategy (Updated)

We use a **factory pattern** combined with **per-feature bootstrapping**:

- Store is defined as a factory function `create<Feature>Store(deps)` that receives the service.
- **Feature bootstrap** (in `bootstrap.ts`, exported via `index.ts`) decides real vs. mock repository (based on config/env), creates the repository (injecting global dependencies like ApiClient), instantiates the **real service** with the repository, and wires the store.
- Components import the **pre-configured store** returned by the bootstrap (no deps needed at usage site).
- We rely on **TypeScript structural typing** (duck typing) for service injection. No explicit service port/interface files are required.
- This approach:
  - Keeps store logic framework-agnostic and portable
  - Provides explicit, type-safe DI
  - Enables environment-aware wiring (real vs. mock repository)
  - Excellent testability (real service logic tested with controlled data)
  - Minimizes boilerplate (no full service mocks needed in most cases)

## Rules for Writing Store Code

1. **Store Factory Only**
   - Always export a factory function `create<Feature>Store(deps: { <feature>Service: any })` where the service shape is defined inline via structural typing.
   - Do **not** call `defineStore` directly in the feature barrel.
   - Example:
     ```typescript
     // features/prompts/store/promptsStore.ts
     import { defineStore } from 'pinia'

     type PromptServiceShape = {
       getPrompts(): Promise<Prompt[]>
     }

     export function createPromptsStore({ promptService }: { promptService: PromptServiceShape }) {
       return defineStore('prompts', {
         state: () => ({ /* ... */ }),
         actions: {
           async fetchPrompts() {
             // Call promptService methods directly
           }
         }
       })
     }
     ```

2. **Bootstrapping Handles Wiring**
   - The feature's `bootstrap.ts` creates global dependencies (e.g., ApiClient), decides the repository (real or mock), injects it into the **real service**, and calls the store factory.
   - It returns a pre-configured `use<Feature>Store` function (and optionally routes).
   - Example updated workflow (primary: repository-level mocking with global config and dependencies):
     ```typescript
     // features/prompts/bootstrap.ts (internal)
     import { PromptService } from './services/PromptService'
     import { MockPromptRepository } from './repositories/MockPromptRepository'
     import { HttpPromptRepository } from './repositories/HttpPromptRepository'
     import { ApiClient } from '@/common/http/HttpClient'
     import { appConfig } from '@/common/config/AppConfig'
     import { createPromptsStore } from './store/promptsStore'
     import promptsRoutes from './routes'

     const bootstrapPrompts = () => {
         const useMocks = appConfig.isMockEnv

         const apiClient = new ApiClient(appConfig.baseUrl);
         const repository = useMocks
             ? new MockPromptRepository()
             : new HttpPromptRepository(apiClient)

         const service = new PromptService(repository)
       
         return {
             useStore: createPromptsStore({ promptService: service }),
             routes: promptsRoutes ?? [],
         }
     }

     export { bootstrapPrompts }

     // features/prompts/index.ts (barrel)
     export { bootstrapPrompts } from './bootstrap'
     ```

3. **Using the Store from a Component** (Unchanged)
   ```vue
   <script setup lang="ts">
   import { usePromptsStore } from '@/features/prompts'  // Now comes from bootstrap
   const store = usePromptsStore()
   </script>
   ```

4. **Automated Testing of the Store**
   - Use the feature bootstrap with repository mocks to test the real service logic.
   ```typescript
   it('fetches prompts using mock repository data', async () => {
     // For tests, temporarily override appConfig or pass options if extended
     const { useStore } = bootstrapPrompts()  // Assuming mock env detected
     const store = useStore()
     await store.fetchPrompts()
     // assertions on real service behavior with mock data...
   })
   ```

5. **Additional Rules** (Updated)
   - **No direct data access** – always via injected service.
   - **No business logic** – delegate to services or domain entities.
   - **Error handling** – wrap async actions in try/catch and update `error` state.
   - **Naming** – Actions: verb-based. Getters: noun/phrase.
   - **Centralized wiring deprecated** – do not add new stores to old `storeProviders.ts`.
   - **Every feature must export its bootstrap function** from `index.ts`.
   - **Mocking Strategy**: Mock primarily at the repository level (inject mock repository into real service). Use full service mocks only when service logic needs to be bypassed entirely.
   - **Ports/Interfaces**: Use only for repositories (frequently swapped). For services, use duck typing exclusively.
   - **Global Dependencies**: Inject shared infrastructure (e.g., ApiClient, config) into repositories during bootstrapping.

These guidelines keep Pinia stores clean, testable, minimally boilerplated, and properly integrated into our self-bootstrapping feature module design, with a focus on testing real application logic against controlled data access.