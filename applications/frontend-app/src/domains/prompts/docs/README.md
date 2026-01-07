# Prompts

Prompts domain handles prompt templates.

## Purpose

We use AI every day to accelerate feature design, architectural decisions, code generation, testing, documentation, and more.  
This prompts repository ensures every team member can quickly discover and reuse the best prompts instead of recreating them from scratch.

## Features (Current)

- Browse all shared prompts
- Filter by title or category (hierarchical, e.g. `design/features/validation`)
- Filter by tags
- Search by title or tags
- One-click copy of prompt template or instructions

## User Stories

### Story: Browse All Shared Prompts

When not sure of the prompt I need, I want to easily browse through all the prompts in the database so that I can see if there is one suitable for my need.

Acceptance Criteria:

- Given the user is on the prompts repository page, when they navigate to the browse section without applying any filters or search, then they should see a list of all prompts displayed.
- Given the user is on the prompts list page, when they enter a filter/search term, then only prompts whose title or category contains that term are displayed.
- There is a delay for filtering of 500 milliseconds while user is typing
- Each listed prompt should display its title, category (showing the full hierarchical path, e.g., "design/features/validation"), and tags.
- The list should include a preview or truncated view of the instructions and template for quick scanning.
- Prompts should be sortable by title, category, or most recent (default to title alphabetical).
- If there are more than 20 prompts, pagination should be available to load additional pages.
- The user should be able to click on a prompt to view its full details, including complete instructions and template.
- There should be no performance issues (e.g., loading time under 2 seconds) when browsing up to 100 prompts.

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
