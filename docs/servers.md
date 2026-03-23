# Servers Page

## Overview

The Servers page (`/`) is the main landing page of the Claude Code Dashboard. It provides a visual interface for managing MCP (Model Context Protocol) server configurations stored in your `.claude.json` file. Instead of manually editing JSON, you can add, edit, remove, and toggle servers through an intuitive UI.

## Features

| Feature | Description |
|---------|-------------|
| **Add Server** | Register a new MCP server with command, arguments, and environment variables |
| **Edit Server** | Modify an existing server's command, args, or env configuration |
| **Delete Server** | Remove a server entry from `.claude.json` |
| **Enable/Disable Toggle** | Temporarily disable a server without removing its configuration |
| **Tools Count Badge** | Shows how many tools each server exposes |
| **JSON Editor** | Advanced mode for directly editing the server's JSON block |
| **Status Indicator** | Visual indicator showing whether the server is reachable |

## API Endpoints Used

### GET /api/config

Retrieves the current `.claude.json` configuration, including all registered MCP servers.

```json
// Response
{
  "mcpServers": {
    "my-server": {
      "command": "npx",
      "args": ["-y", "@my-org/my-server"],
      "env": { "API_KEY": "sk-..." }
    }
  }
}
```

### POST /api/config

Saves updated server configuration back to `.claude.json`.

```json
// Request body
{
  "mcpServers": {
    "my-server": {
      "command": "npx",
      "args": ["-y", "@my-org/my-server"],
      "env": { "API_KEY": "sk-..." }
    }
  }
}
```

### GET /api/tools

Fetches the list of tools exposed by MCP servers. Used to display the tools count badge on each server card.

```json
// Response
[
  { "name": "tool_name", "server": "my-server", "description": "..." }
]
```

## How It Works

1. On page load, the dashboard calls `GET /api/config` to load all server entries.
2. Each server is rendered as a card showing its name, command, argument count, and tools count.
3. The tools count is populated by calling `GET /api/tools` and grouping results by server name.
4. When you add or edit a server, a modal form collects the command, args (as a JSON array), and env (as key-value pairs).
5. On save, the full updated config is sent via `POST /api/config`, which writes it back to `.claude.json`.
6. The enable/disable toggle sets a `disabled: true` flag on the server entry.

## Configuration Options

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `command` | string | Yes | The executable to run (e.g., `npx`, `node`, `python`) |
| `args` | string[] | No | Arguments passed to the command |
| `env` | object | No | Environment variables as key-value string pairs |
| `disabled` | boolean | No | When `true`, the server is registered but not active |

### Example Server Configuration

```json
{
  "command": "npx",
  "args": ["-y", "@anthropic/my-mcp-server@latest"],
  "env": {
    "API_KEY": "your-api-key",
    "BASE_URL": "https://api.example.com"
  }
}
```

## Screenshots

<!-- Add screenshots here -->
> _Screenshot: Server list view with cards_

> _Screenshot: Add/Edit server modal_

> _Screenshot: JSON editor mode_

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Server shows 0 tools | Ensure the server is running and reachable. Check that the command and args are correct. |
| Changes not persisting | Verify that the dashboard backend has write access to `~/.claude.json`. |
| "Command not found" error | Make sure the command (e.g., `npx`, `node`) is available in your system PATH. |
| Environment variables not applied | Ensure env values are strings. Restart the server after changing env vars. |
| Duplicate server name error | Server names must be unique. Rename or remove the conflicting entry. |
| Toggle not working | Check browser console for API errors. Confirm `POST /api/config` returns 200. |
