# Prompt Library

## Overview

The Prompt Library page (`/prompts`) lets you save, organize, and reuse frequently used prompts for Claude Code. Prompts are stored locally in your browser and can be rated, searched, sorted, and shared via JSON export.

## Features

### Create, Edit, and Delete Prompts
Add new prompts with a title, body text, and optional tags. Edit existing prompts to refine them over time. Delete prompts you no longer need. All changes are saved immediately to localStorage.

### Star Rating (1-5)
Rate each prompt on a 1-to-5 star scale. Ratings help you surface your best prompts and sort by quality. Click the stars to set or update the rating at any time.

### Copy to Clipboard
Each prompt card has a copy button that copies the prompt text to your clipboard, ready to paste into a Claude Code session. The button shows a brief confirmation animation on success.

### Search
A search bar filters prompts in real time by matching against titles, body text, and tags. Results update as you type with no debounce delay.

### Sort Options
Sort your prompt library by:
- **Rating** -- Highest-rated prompts first.
- **Date** -- Most recently created or edited prompts first.
- **Most Used** -- Prompts sorted by how many times they have been copied to clipboard.

### Import / Export JSON
Export your entire prompt library as a JSON file for backup or sharing. Import a JSON file to merge prompts into your library. Duplicate detection prevents importing the same prompt twice (matched by title).

### Import from Chat History
Pull commonly used prompt patterns from your Claude Code conversation history. The dashboard analyzes your past sessions via the API and suggests prompts that you have used repeatedly. You can review and selectively import them into your library.

## API Endpoints

### GET /api/common-prompts
Analyzes Claude Code conversation history to identify frequently used prompt patterns. Returns an array of prompt suggestions, each with:
- `text` -- The prompt content.
- `count` -- Number of times a similar prompt was used.
- `firstUsed` -- Timestamp of earliest occurrence.
- `lastUsed` -- Timestamp of most recent occurrence.

Query parameters:
- `project` -- Scope analysis to a specific project.
- `minCount` -- Minimum occurrence threshold (default: 2).

All other prompt operations (CRUD, ratings, sort preferences) are handled client-side using localStorage. No additional API endpoints are required.

## How It Works

1. Prompts are stored in the browser's localStorage under a dedicated key (`claude-dashboard-prompts`). Each prompt is a JSON object with fields: `id`, `title`, `body`, `tags`, `rating`, `createdAt`, `updatedAt`, and `useCount`.
2. When you copy a prompt, its `useCount` is incremented and `updatedAt` is refreshed.
3. The search function filters the in-memory prompt list using case-insensitive substring matching across title, body, and tags.
4. Export serializes the full prompt array to a JSON file and triggers a browser download. Import reads a JSON file, validates its structure, and merges new prompts into the existing list.
5. The "Import from Chat History" feature calls the `/api/common-prompts` endpoint. The backend scans user messages across sessions, normalizes them (strips variable content), and groups similar messages. Messages that appear more than the threshold are returned as suggestions.
6. Sort state and display preferences are also stored in localStorage.

## Troubleshooting

### Prompts disappear after clearing browser data
- Prompts are stored in localStorage. Clearing browser data, cookies, or site data will erase them.
- Use the export feature regularly to create backups of your prompt library.

### Import fails with "invalid format"
- The import file must be a valid JSON array of prompt objects. Each object must have at least a `title` and `body` field.
- Check that the file is not corrupted and uses UTF-8 encoding.

### "Import from Chat History" shows no suggestions
- You need at least a few sessions with repeated prompts for the analysis to produce results.
- Adjust the `minCount` threshold if your prompts are not repeated often enough.
- Ensure the backend can access your Claude Code history files.

### Copy button does not work
- Clipboard access requires the page to be served over HTTPS or localhost.
- Grant clipboard permissions if your browser prompts for them.

### Ratings do not save
- Check that localStorage is not full. Browsers typically allow 5-10MB per origin.
- Ensure no browser extensions are blocking localStorage access.

### Search is slow with many prompts
- The search is in-memory and should be fast for libraries of up to several thousand prompts.
- If performance is an issue, consider deleting unused prompts or exporting and archiving old ones.

### Duplicate prompts after import
- Duplicate detection matches by exact title. If titles differ slightly, duplicates may be imported.
- Manually review and delete duplicates after import.
