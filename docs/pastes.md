# Paste History

## Overview

The Paste History page (`/pastes`) lets you search and browse everything that has been pasted into Claude Code sessions. It aggregates content from two sources -- paste-cache files and conversation history -- into a unified, searchable interface.

## Features

### Search
A full-text search bar filters paste entries by content. Results update as you type, highlighting matched text within each paste. Search works across both data sources simultaneously.

### Two Tabs
Paste history is split into two tabs reflecting the underlying data sources:

- **Cache Tab** -- Shows entries from Claude Code's paste-cache files. These are standalone files stored when you paste content into the CLI. Each entry shows the paste content, timestamp, and file size.
- **Conversations Tab** -- Shows `pastedContents` extracted from `history.jsonl` session files. Each entry includes the pasted text, the session it belongs to, and the surrounding message context.

### Copy to Clipboard
Every paste entry has a copy button to copy the content back to your clipboard. Useful for re-pasting content into new sessions or other applications.

### Expandable Content
Long paste entries are truncated by default with an expand/collapse toggle. Click to reveal the full content. This keeps the list view manageable when browsing many entries.

## API Endpoints

### GET /api/paste-history
Returns paste entries from both sources. Response structure:

```json
{
  "cache": [
    {
      "id": "paste-abc123",
      "content": "...",
      "timestamp": "2025-12-01T10:30:00Z",
      "size": 1024
    }
  ],
  "conversations": [
    {
      "id": "conv-xyz789",
      "content": "...",
      "sessionId": "session-uuid",
      "timestamp": "2025-12-01T11:00:00Z",
      "messageContext": "User pasted this while asking about..."
    }
  ]
}
```

Query parameters:
- `search` -- Filter entries by text content (server-side search).
- `source` -- Return only `cache` or `conversations` entries.
- `limit` -- Maximum entries per source (default: 100).
- `offset` -- Pagination offset.

## How It Works

1. **Paste-Cache Source**: Claude Code stores pasted content in cache files under `~/.claude/paste-cache/`. The backend reads these files, extracts content and metadata (timestamps from file modification dates), and returns them as structured entries.

2. **Conversation Source**: When content is pasted into a Claude Code session, it is recorded in the `history.jsonl` file as a `pastedContents` field within user message events. The backend parses these files and extracts paste entries along with session context.

3. The API combines both sources into a single response. The frontend separates them into tabs for clarity.

4. Search is performed server-side by filtering entries whose content matches the search string (case-insensitive substring match). This avoids sending large paste content to the client unnecessarily.

5. Content is truncated to 500 characters in the list response. Full content is available when expanding an entry (fetched on demand or included in the initial payload depending on size).

## Troubleshooting

### No paste entries found
- Verify that you have pasted content into Claude Code sessions. Regular typed messages are not captured as paste events.
- Check that `~/.claude/paste-cache/` exists and contains files (for the cache tab).
- Ensure `history.jsonl` files exist under `~/.claude/projects/` (for the conversations tab).

### Cache tab is empty but conversations tab has entries
- The paste-cache feature may not be enabled in your Claude Code version.
- Cache files may have been cleaned up or deleted. Only the conversation history retains paste records permanently.

### Search returns no results
- Try shorter or more general search terms. Search uses substring matching, not fuzzy matching.
- Ensure you are not filtering by source tab while searching. Search applies to the currently visible tab.

### Paste content appears truncated
- Click the expand button on the entry to reveal full content.
- Very large pastes (over 100KB) may be truncated even when expanded, to prevent browser performance issues.

### Copy button does not work
- Clipboard access requires HTTPS or localhost. Ensure the dashboard is accessed via a supported URL.
- Check browser permissions for clipboard access.

### Entries appear out of order
- Entries are sorted by timestamp. Cache file timestamps use file modification time, which may not reflect the actual paste time if files were moved or copied.
- Conversation entries use the session event timestamp, which is more reliable.

### Loading is slow
- Large paste-cache directories or many history files can slow the initial load.
- Use the `limit` parameter to paginate results or filter by `source` to reduce data.
