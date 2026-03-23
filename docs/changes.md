# File Changes

## Overview

The File Changes page (`/changes`) lets you browse the revision history of files modified during Claude Code sessions. It groups changes by session, shows multiple versions per file, and provides an inline diff viewer for comparing revisions.

## Features

### Change Groups by UUID
File changes are organized by session UUID. Each group represents a single Claude Code session and lists all files that were created, modified, or deleted. Groups are displayed in reverse chronological order.

### Multiple Versions per File
When a file is modified multiple times within a session, each version is tracked separately. You can step through the versions to see how the file evolved during the conversation.

### Inline Line-by-Line Diff
A unified diff viewer highlights changes between consecutive versions of a file:
- **Green** (added lines) -- New content introduced in this version.
- **Red** (removed lines) -- Content that was deleted or replaced.
- Unchanged lines are shown with normal styling for context.

### Copy Content to Clipboard
Each file version has a copy button that copies the full file content at that revision to your clipboard. Useful for extracting a specific version without navigating the file system.

### Save-As / Rollback
Restore a previous version of a file by saving it to a specified path. Enter a file path in the input field and click save to write the selected version to disk. This can be used to rollback unwanted changes or save an alternative version alongside the current file.

## API Endpoints

### GET /api/file-history
Returns a list of file change groups. Each group includes:
- Session UUID
- Timestamp
- List of files with version counts

Supports query parameters:
- `project` -- Filter by project path.
- `limit` -- Maximum number of groups to return (default: 50).
- `offset` -- Pagination offset.

### GET /api/file-history/content
Returns the content of a specific file version. Query parameters:
- `id` -- The change record identifier.
- `version` -- Version index within the change group (0-based).

Returns the raw file content as a string.

### POST /api/file-history/save-as
Writes a specific file version to a given path on disk. Request body:
```json
{
  "id": "<change-record-id>",
  "version": 0,
  "targetPath": "/absolute/path/to/save"
}
```

Returns `{ "success": true }` on success or an error message if the write fails.

## How It Works

1. Claude Code records file snapshots in a local change cache. Before and after each tool call that modifies a file, the content is captured and stored.
2. The dashboard backend reads these change records and groups them by session UUID.
3. When a change group is expanded in the UI, the frontend fetches file content for the selected versions via the content endpoint.
4. The diff is computed client-side using a standard unified diff algorithm, comparing consecutive versions of the same file.
5. Save-as requests are forwarded to the backend, which writes the specified version content to the target path with appropriate file permissions.

## Troubleshooting

### No change groups appear
- File history tracking requires Claude Code to have the change cache enabled. Check that `~/.claude/` contains change tracking data.
- The backend must have read access to the change cache directory.

### Diff shows entire file as changed
- This typically occurs for the first version of a newly created file, where there is no previous version to compare against.
- Binary files or files with encoding changes may also show as fully replaced.

### Save-as fails with permission error
- The dashboard backend needs write access to the target directory.
- Ensure the target path is absolute and the parent directory exists.
- On Windows, check that the path is not locked by another process.

### Large files load slowly
- File content is fetched on demand. Very large files (10MB+) may take a moment to load and diff.
- The diff computation is client-side; performance depends on browser capabilities.

### Missing versions in a session
- If Claude Code crashed mid-session, some change records may be incomplete.
- Only tool calls that completed successfully have their after-snapshots recorded.

### Copy button does not work
- Clipboard access requires HTTPS or localhost. Ensure you are accessing the dashboard via `localhost` or a secure connection.
- Some browsers require explicit clipboard permission; check your browser settings.
