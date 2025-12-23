# Prompts

Prompts domain handles prompt templates.

## Purpose

We use AI every day to accelerate feature design, architectural decisions, code generation, testing, documentation, and more.  
This prompts repository ensures every team member can quickly discover and reuse the best prompts instead of recreating them from scratch.

## Features (Current)

- Browse all shared prompts
- Filter by category (hierarchical, e.g. `design/features/validation`)
- Filter by tags
- Search by title or tags
- One-click copy of prompt template or instructions

## Prompt Data Model

Each prompt follows this structure (TypeScript interface):

```typescript
export interface Prompt {
  id: string;                  // unique identifier (UUID or similar)
  title: string;               // short, descriptive name
  instructions: string;        // optional high-level guidance / context
  template: string;            // the actual prompt text (with placeholders if needed)
  category: string;            // hierarchical: e.g. "design/features/validation"
  tags: string[];              // e.g. ["design", "validation", "shared"]
}
```
