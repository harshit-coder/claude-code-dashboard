# CLAUDE.md Editor Page (`/docs`)

## Overview

The CLAUDE.md Editor page lets you discover and edit all `CLAUDE.md` files across your projects. These files provide project-specific instructions that Claude reads at the start of every conversation. The editor searches your home directory and all project directories to find every relevant file.

## Features

- **Auto-discovery** of CLAUDE.md files across all projects
- **Expandable cards** showing file path and preview
- **Inline editor** with syntax-aware text area for editing markdown
- **Save with backup** creating a `.bak` copy before overwriting
- **Discard changes** to revert edits without saving
- **File type indicators** distinguishing between CLAUDE.md variants

## How It Works

### File Discovery

The API scans the following locations for documentation files:

| File Pattern | Location | Purpose |
|-------------|----------|---------|
| `CLAUDE.md` | Project root | Main project instructions |
| `.claude/CLAUDE.md` | Project `.claude/` dir | Alternative location for project instructions |
| `CLAUDE.local.md` | Project root | Local overrides not committed to version control |

The search covers:
1. The user's home directory (`~/`)
2. All project directories registered under `~/.claude/projects/`
3. Common code directories (configurable)

### Card Display

Each discovered file appears as a card showing:

- **File path** (absolute path to the file)
- **File size** and last modified date
- **Preview** of the first few lines
- **Expand button** to open the full editor

### Inline Editor

Clicking a card expands it to reveal a full-text editor. The editor provides:

- Monospace font for markdown editing
- Tab key support for indentation
- Auto-resize based on content length
- Unsaved changes indicator (dot on the card header)

### Save with Backup

When saving, the API:

1. Creates a backup copy at `<filename>.bak` (e.g., `CLAUDE.md.bak`)
2. Writes the new content to the original file
3. Returns a success confirmation

This ensures you can always recover the previous version if needed.

### Discard Changes

The discard button reloads the file content from disk, replacing any unsaved edits in the editor.

## API Endpoints

### `GET /api/docs`

Returns all discovered CLAUDE.md files with their content.

**Response:**

```json
{
  "docs": [
    {
      "path": "/home/user/projects/my-app/CLAUDE.md",
      "content": "# Project Instructions\n\nThis is a React app...",
      "size": 1024,
      "modified": "2026-03-20T14:00:00Z",
      "type": "CLAUDE.md"
    },
    {
      "path": "/home/user/projects/my-app/CLAUDE.local.md",
      "content": "# Local overrides\n\nUse port 3001...",
      "size": 256,
      "modified": "2026-03-21T09:00:00Z",
      "type": "CLAUDE.local.md"
    }
  ]
}
```

### `POST /api/docs/save`

Saves updated content to a CLAUDE.md file, creating a backup first.

**Request body:**

```json
{
  "path": "/home/user/projects/my-app/CLAUDE.md",
  "content": "# Updated Project Instructions\n\nNew content here..."
}
```

**Response:**

```json
{
  "success": true,
  "backup": "/home/user/projects/my-app/CLAUDE.md.bak"
}
```

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| Search root | `~/` | Starting directory for file discovery |
| Projects root | `~/.claude/projects/` | Additional directory tree to scan |
| Backup enabled | `true` | Whether to create `.bak` files on save |
| Max file size | 1 MB | Files larger than this are skipped during discovery |

## Troubleshooting

- **No files found:** Ensure you have at least one `CLAUDE.md` file in your home directory or a project directory.
- **Save fails with permission error:** Check write permissions on both the target file and its parent directory (needed for backup creation).
- **Backup file not created:** Verify the directory has write permissions and sufficient disk space.
- **Editor shows stale content:** Click the discard button or refresh the page to reload from disk.
- **Large files truncated:** Files exceeding the max file size setting are excluded from discovery. Increase the limit if needed.
- **CLAUDE.local.md not found:** This file is optional and only appears if it exists in a project root alongside `CLAUDE.md`.
