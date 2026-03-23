# Sessions Page (`/sessions`)

## Overview

The Sessions page allows you to browse past Claude Code conversation sessions. Each session is stored as a JSONL file under `~/.claude/projects/` and represents a single conversation with Claude, including all messages, tool calls, and responses.

## Features

- **Sortable table** with columns for date, project, session ID, message count, and file size
- **Search by project** name using a text input filter
- **Filter by project** using a dropdown selector for exact matching
- **Relative date formatting** (e.g., "2 hours ago", "3 days ago")
- **Click to view** session details and conversation content
- **Pagination** for large session lists

## How It Works

### Session Storage

Claude Code stores each conversation session as a `.jsonl` (JSON Lines) file in the project-specific directory:

```
~/.claude/projects/<project-path>/sessions/<session-id>.jsonl
```

Each line in the JSONL file represents a single message or event in the conversation:

```json
{"role": "user", "content": "Create a new component", "timestamp": "2026-03-22T10:30:00Z"}
{"role": "assistant", "content": "I'll create that component...", "timestamp": "2026-03-22T10:30:05Z"}
{"role": "tool_use", "name": "Write", "input": {"file_path": "..."}, "timestamp": "2026-03-22T10:30:06Z"}
```

### Table Columns

| Column | Description | Sortable |
|--------|-------------|----------|
| Date | Session start timestamp, shown as relative time | Yes |
| Project | Project directory name | Yes |
| Session ID | Unique identifier (UUID) for the session | No |
| Messages | Total number of messages in the conversation | Yes |
| Size | File size of the JSONL file (KB/MB) | Yes |

### Sorting

Click any sortable column header to sort ascending; click again to sort descending. The default sort is by date (newest first).

### Filtering

Two filtering mechanisms are available:

1. **Text search** - Type in the search box to filter sessions whose project name contains the query string (case-insensitive).
2. **Project dropdown** - Select a specific project from the dropdown to show only sessions from that project. Selecting "All Projects" clears the filter.

Both filters can be used simultaneously.

### Relative Dates

Timestamps are displayed in human-friendly relative format:

| Time Difference | Display |
|----------------|---------|
| < 1 minute | "just now" |
| < 1 hour | "X minutes ago" |
| < 24 hours | "X hours ago" |
| < 7 days | "X days ago" |
| < 30 days | "X weeks ago" |
| >= 30 days | "MMM DD, YYYY" |

## API Endpoints

### `GET /api/sessions`

Returns a list of all available sessions with metadata.

**Query parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `project` | string | Filter by project name (optional) |
| `sort` | string | Sort field: `date`, `project`, `messages`, `size` (default: `date`) |
| `order` | string | Sort order: `asc` or `desc` (default: `desc`) |

**Response:**

```json
{
  "sessions": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "project": "my-web-app",
      "date": "2026-03-22T10:30:00Z",
      "messages": 47,
      "size": 125400,
      "path": "/home/user/.claude/projects/my-web-app/sessions/a1b2c3d4.jsonl"
    }
  ],
  "projects": ["my-web-app", "api-server", "docs-site"],
  "total": 342
}
```

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| Sessions root | `~/.claude/projects/` | Base directory scanned for session files |
| Page size | 50 | Number of sessions displayed per page |

## Troubleshooting

- **No sessions found:** Verify that `~/.claude/projects/` exists and contains project subdirectories with `sessions/` folders holding `.jsonl` files.
- **Session appears empty:** The JSONL file may be corrupted or contain only system messages. Check the raw file content.
- **Large session list loads slowly:** Projects with hundreds of sessions may take a moment. Use the project filter to narrow results.
- **Date shows "Invalid Date":** The session file may have malformed timestamps. Check the first line of the JSONL file.
- **Project dropdown missing entries:** Only projects with at least one session file appear in the dropdown.
