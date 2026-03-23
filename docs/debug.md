# Debug Logs

## Overview

The Debug Logs page (`/debug`) provides a browser-based viewer for Claude Code's debug log files. It helps you diagnose issues by surfacing errors, warnings, and patterns across log files with color-coded rendering and filtering.

## Features

### Log File List
The sidebar displays all available debug log files sorted by date (newest first). Each entry shows the filename, file size, and badge counts for errors and warnings found in that file.

### Color-Coded Log Viewer
Log entries are rendered with color coding by severity level:
- **ERROR** -- Red background, making critical failures immediately visible.
- **WARN** -- Orange text for issues that may need attention.
- **INFO** -- Default styling for informational messages.
- **DEBUG** -- Dimmed/grey text to reduce visual noise from verbose debug output.

### Level Filters
Toggle visibility of each log level independently. For example, hide DEBUG and INFO messages to focus only on errors and warnings. Filter state persists during the session.

### Search
Full-text search across the currently loaded log file. Matching lines are highlighted and the viewer scrolls to the first match. Supports plain text and regular expression patterns.

### Jump to First Error
A quick-action button that scrolls the log viewer directly to the first ERROR-level entry in the file. Saves time when triaging long log files.

### Common Errors Tab
A dedicated analysis tab that scans all available log files and identifies recurring error patterns. Errors are grouped by message similarity, ranked by frequency, and displayed with:
- The error pattern/template
- Number of occurrences across all logs
- Date range of occurrences
- Example full error messages

## API Endpoints

### GET /api/debug
Returns a list of available debug log files with metadata. Each entry includes:
- Filename
- File size in bytes
- Last modified timestamp
- Error count
- Warning count

### GET /api/debug/content
Returns the content of a specific debug log file. Query parameters:
- `file` -- The log filename to retrieve.
- `offset` -- Line offset for pagination (default: 0).
- `limit` -- Maximum lines to return (default: 1000).

Returns an array of log line objects with `level`, `timestamp`, `message`, and `source` fields.

### GET /api/debug/common-errors
Analyzes all debug log files and returns grouped error patterns. Response includes:
- Array of error pattern objects, each with `pattern`, `count`, `firstSeen`, `lastSeen`, and `examples`.
- Sorted by count descending.

## How It Works

1. Claude Code writes debug logs to `~/.claude/logs/`. Each session or day produces a separate log file.
2. The backend scans the logs directory and parses each file to extract structured log entries (timestamp, level, message).
3. Error and warning counts are computed during the initial scan and cached for the file list view.
4. When a log file is opened, content is streamed to the frontend with pagination to handle large files efficiently.
5. The common errors analysis uses pattern normalization (stripping variable parts like timestamps, IDs, and paths) to group similar errors together across all log files.
6. The frontend applies color coding and filtering client-side based on the `level` field of each log entry.

## Troubleshooting

### No log files appear
- Claude Code must be run with debug logging enabled. Check your Claude Code configuration.
- Verify that `~/.claude/logs/` exists and contains `.log` files.
- Ensure the backend has read permissions on the logs directory.

### Log viewer is blank after selecting a file
- The file may be empty or contain only whitespace.
- Check the browser console for parsing errors if the log format is unexpected.

### Search finds no results
- Search is scoped to the currently loaded log file, not all files. Switch files to search elsewhere.
- If using regex, ensure the pattern is valid. Invalid patterns silently return no results.

### Common Errors tab is slow
- This analysis reads all log files, which can be slow if there are many large files.
- Consider archiving or deleting old log files to improve performance.

### Error/warning counts seem incorrect
- Counts are based on log level parsing. Non-standard log formats may not be parsed correctly.
- Counts are cached; restart the backend to recompute after log files change.

### Colors do not display
- Ensure your browser supports CSS custom properties. Try a modern browser (Chrome, Firefox, Edge).
- Check that no browser extensions are overriding page styles.
