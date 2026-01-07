# Notes

Notes domain handles note templates.

## Purpose

The purpose of the notes domain is to keep the structured repository of notes.

## Features (Current)

- Browse all notes
- Filter by title or category (hierarchical, e.g. `design/features/validation`)
- Filter by tags
- Search by title or tags
- One-click copy of note template or instructions

## User Stories

### Story: Browse All Shared Notes

When not sure of the note I need, I want to easily browse through all the notes in the database so that I can see if there is one suitable for my need.

Acceptance Criteria:

- Given the user is on the notes repository page, when they navigate to the browse section without applying any filters or search, then they should see a list of all notes displayed.
- Given the user is on the notes list page, when they enter a filter/search term, then only notes whose title or category contains that term are displayed.
- There is a delay for filtering of 500 milliseconds while user is typing
- Each listed note should display its title, category (showing the full hierarchical path, e.g., "design/features/validation"), and tags.
- The list should include a preview or truncated view of the instructions and template for quick scanning.
- Notes should be sortable by title, category, or most recent (default to title alphabetical).
- If there are more than 20 notes, pagination should be available to load additional pages.
- The user should be able to click on a note to view its full details, including complete instructions and template.
- There should be no performance issues (e.g., loading time under 2 seconds) when browsing up to 100 notes.

## Note Data Model

Each note follows this structure (TypeScript interface):

```typescript
export interface Note {
  id: string;                  // unique identifier (UUID or similar)
  title: string;               // short, descriptive name
  instructions: string;        // optional high-level guidance / context
  template: string;            // the actual note text (with placeholders if needed)
  category: string;            // hierarchical: e.g. "design/features/validation"
  tags: string[];              // e.g. ["design", "validation", "shared"]
}
```
