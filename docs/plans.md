# Plans & Todos Page (`/plans`)

## Overview

The Plans & Todos page provides a unified view of saved plans and todo items created by Claude Code. Plans are markdown documents stored in `~/.claude/plans/`, while todos are structured JSON files in `~/.claude/todos/`. The page uses a tabbed interface to switch between the two views.

## Features

- **Tabbed interface** switching between Plans and Todos
- **Expandable plan cards** showing title and preview, click to expand full content
- **Rendered markdown** for plan content with proper formatting
- **Todo items with status indicators** using color-coded badges
- **Status filtering** for todos (all, completed, in-progress, pending, blocked)
- **Chronological ordering** with newest items first

## How It Works

### Plans

Plans are markdown files saved by Claude during conversations when it creates implementation plans, architecture designs, or multi-step strategies.

**File location:** `~/.claude/plans/*.md`

Example plan file:

```markdown
# Migration Plan: Database v2 to v3

## Phase 1: Schema Updates
- Add new columns to users table
- Create migration scripts

## Phase 2: Data Migration
- Run backfill job for existing records
- Validate data integrity

## Phase 3: Cutover
- Switch application to new schema
- Monitor for errors
```

Plans are displayed as collapsible cards. The card header shows the filename and first line (typically the `# Title`). Clicking a card expands it to show the full rendered markdown content.

### Todos

Todos are structured items stored as JSON files with status tracking.

**File location:** `~/.claude/todos/*.json`

Example todo file:

```json
{
  "id": "todo-001",
  "title": "Refactor authentication module",
  "description": "Extract OAuth logic into separate service class",
  "status": "in-progress",
  "created": "2026-03-20T14:00:00Z",
  "updated": "2026-03-21T09:30:00Z"
}
```

### Todo Status Types

| Status | Badge Color | Description |
|--------|-------------|-------------|
| `completed` | Green | Task is finished |
| `in-progress` | Blue | Task is actively being worked on |
| `pending` | Yellow | Task is queued but not started |
| `blocked` | Red | Task cannot proceed due to a dependency |

### Tab Navigation

The page header contains two tabs:

- **Plans** (default) - Shows all plan markdown files
- **Todos** - Shows all todo JSON items with status indicators

The selected tab is highlighted and the content area updates accordingly.

## API Endpoints

### `GET /api/plans`

Returns all plans and todos.

**Response:**

```json
{
  "plans": [
    {
      "filename": "migration-plan.md",
      "title": "Migration Plan: Database v2 to v3",
      "content": "# Migration Plan...\n\n## Phase 1...",
      "modified": "2026-03-20T14:00:00Z",
      "size": 2048
    }
  ],
  "todos": [
    {
      "id": "todo-001",
      "title": "Refactor authentication module",
      "description": "Extract OAuth logic into separate service class",
      "status": "in-progress",
      "created": "2026-03-20T14:00:00Z",
      "updated": "2026-03-21T09:30:00Z"
    }
  ]
}
```

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| Plans directory | `~/.claude/plans/` | Directory containing plan markdown files |
| Todos directory | `~/.claude/todos/` | Directory containing todo JSON files |

## Troubleshooting

- **No plans shown:** Check that `~/.claude/plans/` exists and contains `.md` files.
- **No todos shown:** Check that `~/.claude/todos/` exists and contains `.json` files.
- **Plan content not rendering:** Ensure the markdown file is valid UTF-8 and does not contain binary data.
- **Todo status badge missing:** Verify the `status` field in the JSON file matches one of: `completed`, `in-progress`, `pending`, `blocked`.
- **Tabs not switching:** Clear browser cache or check for JavaScript errors in the console.
- **Files not appearing after creation:** The API reads files at request time; refresh the page to see newly created files.
