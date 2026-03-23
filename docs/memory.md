# Memories Page (`/memory`)

## Overview

The Memories page provides a browser-based interface for viewing, editing, and managing Claude's auto-memory files. These memories are markdown files stored per-project that Claude uses to persist context across conversations. The page also supports cloud-based Mem0 memories.

## Features

- **Browse memories** by project directory
- **View memory content** with rendered markdown preview
- **Edit memories** inline with a text editor
- **Delete memories** with confirmation prompt
- **MEMORY.md index** display showing the master index file for each project
- **Mem0 cloud memories** integration for viewing and deleting cloud-stored memories
- **Type badges** indicating memory category (user, feedback, project, reference)

## How It Works

### Local Memories

Claude stores auto-memory files as `.md` files inside `~/.claude/projects/*/memory/`. Each memory file uses frontmatter to define metadata:

```markdown
---
name: example_memory
description: Brief description of what this memory contains
type: reference
---

# Memory Content

Actual memory content goes here...
```

### Memory Types

| Type | Description |
|------|-------------|
| `user` | User-specific preferences and instructions |
| `feedback` | Feedback on Claude's behavior to improve future responses |
| `project` | Project-specific context and conventions |
| `reference` | Reference material like procedures, URLs, credentials |

### MEMORY.md Index

Each project's `memory/` directory contains a `MEMORY.md` file that serves as a table of contents, linking to individual memory files with brief descriptions.

### Mem0 Cloud Memories

Mem0 memories are stored in the cloud via the Mem0 API. They appear in a separate section and can be viewed or deleted but not edited through this interface.

## API Endpoints

### `GET /api/memories`

Returns all local memory files grouped by project.

**Response:**

```json
{
  "projects": {
    "project-name": {
      "index": "# Memory Index\n\n## Reference\n- [file.md](file.md) ...",
      "memories": [
        {
          "name": "example_memory",
          "description": "Brief description",
          "type": "reference",
          "filename": "example_memory.md",
          "content": "# Full content..."
        }
      ]
    }
  }
}
```

### `POST /api/memories/save`

Saves changes to a memory file.

**Request body:**

```json
{
  "project": "project-name",
  "filename": "example_memory.md",
  "content": "Updated content..."
}
```

### `POST /api/memories/delete`

Deletes a memory file from disk.

**Request body:**

```json
{
  "project": "project-name",
  "filename": "example_memory.md"
}
```

### `GET /api/mem0`

Returns all Mem0 cloud memories for the current user.

**Response:**

```json
{
  "memories": [
    { "id": "abc123", "content": "Memory text...", "created_at": "2026-01-15T..." }
  ]
}
```

### `POST /api/mem0/delete`

Deletes a Mem0 cloud memory by ID.

**Request body:**

```json
{
  "id": "abc123"
}
```

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| Memory root | `~/.claude/projects/` | Base directory scanned for project memories |
| Mem0 API key | (none) | Required for Mem0 cloud features; set via environment variable |

## Troubleshooting

- **No memories found:** Ensure `~/.claude/projects/` exists and contains subdirectories with a `memory/` folder.
- **Save fails:** Check file permissions on the target `.md` file and its parent directory.
- **Mem0 section empty:** Verify the Mem0 API key is configured and the Mem0 service is reachable.
- **Frontmatter not parsed:** Ensure the file starts with `---` on the first line followed by valid YAML and a closing `---`.
- **MEMORY.md not showing:** The index file must be named exactly `MEMORY.md` (case-sensitive) inside the `memory/` directory.
