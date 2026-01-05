# Store Layer Guidelines

The `store/` layer uses **Pinia** to handle reactive state management for features. It belongs to the **Presentation** layer and acts as the "glue" between UI components/views and the **Application** layer (services). Stores manage reactive state and orchestrate UI-driven workflows but contain **no business logic**, **no data mapping**, and **no direct data access**.

## Core Principles for Stores

- **Role**: Provide reactive state, getters for derived values, and actions for orchestration. Serve as a reactive facade for the UI.
- **Boundaries**: Stores **must not** contain business rules, DTO mapping, or HTTP calls. They only call injected **application services**.
- **Reactivity**: Pinia automatically makes the entire state object reactive. **Do not** manually wrap properties with `ref()` or `reactive()`.
- **Injection**: Stores depend on the **Application layer** (`services/`) via dependency injection. They **never** depend directly on repositories or API layers.
- **Testability**: Stores are unit-tested with mocked services using `Mock<Feature>Service`.
- **Size**: One store per feature. Keep lean; extract complex orchestration to services.
- **Wiring**: Stores are created via factory functions and pre-configured during **feature bootstrapping** (see architecture.md).

## Dependency Injection Strategy (Updated)

We use a **factory pattern** combined with **per-feature bootstrapping**:

- Store is defined as a factory function `create<Feature>Store(deps)` that receives the service port.
- **Feature bootstrap** (in `bootstrap.ts`, exported via `index.ts`) decides real vs. mock service and wires the store.
- Components import the **pre-configured store** returned by the bootstrap (no deps needed at usage site).
- This approach:
  - Keeps store logic framework-agnostic and portable
  - Provides explicit, type-safe DI
  - Enables environment-aware wiring (real vs. mock)
  - Excellent testability (bootstrap with mocks)

## Rules for Writing Store Code

1. **Store Factory Only**
   - Always export a factory function `create<Feature>Store(deps: { <feature>Service: <Feature>ServicePort })`.
   - Do **not** call `defineStore` directly in the feature barrel.

2. **Bootstrapping Handles Wiring**
   - The feature's `bootstrap.ts` creates the service (real or mock) and calls the store factory.
   - It returns a pre-configured `use<Feature>Store` function.
   - Example updated workflow:
     ```typescript
     // features/invoice/bootstrap.ts (internal)
     export function bootstrapInvoice(options: { useMocks?: boolean } = {}) {
       const service = options.useMocks ? new MockInvoiceService() : new InvoiceService(new InvoiceRepository())
       return {
         useStore: createInvoiceStore({ invoiceService: service }),
         routes: invoiceRoutes,
       }
     }

     // features/invoice/index.ts (barrel)
     export { bootstrapInvoice } from './bootstrap'
     ```

3. **Using the Store from a Component** (Unchanged)
   ```vue
   <script setup lang="ts">
   import { useInvoiceStore } from '@/features/invoice'  // Now comes from bootstrap
   const store = useInvoiceStore()
   </script>
   ```

4. **Automated Testing of the Store**
   - Use the feature bootstrap with mocks or directly instantiate the factory with `Mock<Feature>Service`.
   ```typescript
   it('fetches invoices using mock service data', async () => {
     const { useStore } = bootstrapInvoice({ useMocks: true })
     const store = useStore()
     await store.fetchInvoices()
     // assertions...
   })
   ```

5. **Additional Rules** (Updated)
   - **No direct data access** – always via injected service.
   - **No business logic** – delegate to services or domain entities.
   - **Error handling** – wrap async actions in try/catch and update `error` state.
   - **Naming** – Actions: verb-based. Getters: noun/phrase.
   - **Centralized wiring deprecated** – do not add new stores to old `storeProviders.ts`.
   - **Every feature must export its bootstrap function** from `index.ts`.

These guidelines keep Pinia stores clean, testable, and properly integrated into our self-bootstrapping feature module design.
