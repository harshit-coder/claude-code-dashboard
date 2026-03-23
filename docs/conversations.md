# Conversations

## Overview

The Conversations page (`/conversations`) lets you replay and manage past Claude Code chat sessions. It presents a chat-style viewer that reconstructs the full back-and-forth of each session, making it easy to revisit decisions, review suggestions, and pick up where you left off.

## Features

### Chat-Style Viewer
Messages are rendered in a familiar chat layout with user messages on the right and assistant responses on the left. Code blocks, markdown, and tool calls are all rendered inline.

### Topic Headings
Each conversation is titled using the first user message in the session, giving you a quick summary of what the conversation was about.

### Resume Button
Every conversation card has a resume button that copies `claude --resume <session-id>` to your clipboard. Paste it into your terminal to continue the conversation exactly where you left off.

### Delete Conversations
Remove conversations you no longer need. Deletion is permanent and removes the session from the local JSONL history files.

### Export as Markdown
Export any conversation as a `.md` file. The export preserves message formatting, code blocks, and tool call results in a readable markdown document.

### Session Stats
Each conversation displays a token breakdown showing input tokens, output tokens, cache reads, and cache writes. This helps you understand the cost and complexity of each session.

### Files Changed Panel
A collapsible panel lists every file that was created, modified, or deleted during the session, giving you a quick audit trail of what Claude touched.

## API Endpoints

### GET /api/conversations
Returns a list of all conversation sessions with metadata (ID, project, timestamp, first message, token counts). Supports pagination and filtering by project.

### GET /api/conversations/session
Returns the full message history for a specific session. Query parameter: `id` (session UUID).

### POST /api/conversations/delete
Deletes a conversation by session ID. Request body: `{ "id": "<session-uuid>" }`.

### GET /api/conversations/export
Exports a conversation as markdown. Query parameter: `id` (session UUID). Returns a downloadable `.md` file.

## How It Works

1. Claude Code stores chat history in `.jsonl` files under `~/.claude/projects/`. Each line is a JSON object representing a message or event.
2. The dashboard backend reads these files, groups messages by session UUID, and indexes them for search and filtering.
3. The frontend fetches conversation metadata via the list endpoint, then lazy-loads full message history when a conversation is opened.
4. Token stats are extracted from the `usage` fields embedded in each assistant message event.
5. File changes are derived from tool call events (write, edit, bash commands that modify files).

## URL Parameters

The page supports direct linking via URL parameters:

- `?project=X` -- Filter conversations to a specific project path.
- `?id=Y` -- Open a specific conversation by session UUID on page load.
- `?project=X&id=Y` -- Combine both to scope and open in one link.

## Troubleshooting

### No conversations appear
- Verify that `~/.claude/projects/` contains `.jsonl` history files.
- Check that the dashboard backend has read access to the Claude config directory.
- Ensure the backend server is running and accessible.

### Token stats show zero
- Older Claude Code versions may not record usage data in the history files.
- Update Claude Code to the latest version and start a new session.

### Resume command does not work
- The session must still exist in Claude Code's local state. If the history file was deleted or corrupted, resume will fail.
- Ensure you are running the same Claude Code version that created the session.

### Export produces empty file
- The session may contain only system messages or tool events with no user/assistant content.
- Check the browser console for network errors when triggering the export.

### Files changed panel is empty
- The session may not have involved any file modifications.
- File change detection depends on tool call events being present in the history.

### Conversations load slowly
- Large history files (100MB+) take time to parse. Consider archiving old projects.
- The backend indexes files on first access; subsequent loads will be faster.
