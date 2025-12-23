# Team Prompt Repository

A shared library of high-quality, reusable AI prompts for our SaaS product team.  
Helps us work faster and more consistently in the age of AI by centralizing proven prompts for design, architecture, coding, validation, and more.

## Purpose

We use AI every day to accelerate feature design, architectural decisions, code generation, testing, documentation, and more.  
This repository ensures every team member can quickly discover and reuse the best prompts instead of recreating them from scratch.

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

## Getting Started

### Prerequisites

- Node.js 18+
- [pnpm](https://pnpm.io/) (preferred) or npm/yarn

### Installation

```bash
git clone https://github.com/your-org/team-prompt-repo.git
cd team-prompt-repo
pnpm install
```

### Development

```bash
pnpm dev
```

Open http://localhost:3000 (or your configured port).

### Adding Prompts (Coming Soon)

(Planned: simple form to add new prompts with title, category, tags, template, and instructions.)

## Folder Structure (Example)

```
team-prompt-repo/
├── src/
│   ├── components/         # UI components (PromptCard, FilterBar, etc.)
│   ├── data/               # prompts.json or database connection
│   ├── lib/                # utilities (copy-to-clipboard, filtering logic)
│   ├── pages/              # Next.js pages or app router
│   └── types/              # TypeScript interfaces (Prompt)
├── public/
└── README.md
```

## Contributing

1. Fork the repo
2. Create a branch: `git checkout -b feature/add-prompt-form`
3. Commit your changes
4. Open a pull request

## License

MIT

## Team Members

Feel free to add your name or GitHub handle here once you contribute your first prompt!

---
Built for a product team that wants to ship faster with AI.
