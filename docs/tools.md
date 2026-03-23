# Tools Page

## Overview

The Tools page (`/tools`) allows you to browse, search, and manage individual tools exposed by your MCP servers. You can enable or disable specific tools via the `permissions.deny` list in `settings.local.json`, and attach custom notes, tags, or description overrides stored in your browser's localStorage.

## Features

| Feature | Description |
|---------|-------------|
| **Browse All Tools** | View every tool across all registered MCP servers |
| **Filter by Server** | Show tools from a specific server only |
| **Fetch Tools** | Retrieve tools per server or all at once |
| **Enable/Disable Tools** | Toggle individual tools via the `permissions.deny` list |
| **Custom Notes** | Add personal notes to any tool (stored in localStorage) |
| **Custom Tags** | Tag tools for organization and filtering (stored in localStorage) |
| **Description Override** | Override a tool's default description (stored in localStorage) |
| **Search** | Full-text search across tool names, descriptions, and tags |

## API Endpoints Used

### GET /api/config

Loads the server list to determine which servers to fetch tools from.

### GET /api/tools

Fetches tools from MCP servers. Supports optional query parameters:

```
GET /api/tools                  # All tools from all servers
GET /api/tools?server=my-server # Tools from a specific server
```

```json
// Response
[
  {
    "name": "read_file",
    "server": "filesystem",
    "description": "Read the contents of a file",
    "inputSchema": { "type": "object", "properties": { "path": { "type": "string" } } }
  }
]
```

### GET /api/settings-local

Reads `settings.local.json` to determine which tools are currently denied.

```json
// Response
{
  "permissions": {
    "deny": ["mcp__filesystem__delete_file", "mcp__github__push"]
  }
}
```

### POST /api/settings-local

Updates `settings.local.json` when enabling or disabling a tool.

```json
// Request body
{
  "permissions": {
    "deny": ["mcp__filesystem__delete_file"]
  }
}
```

## How It Works

1. The page loads server configuration via `GET /api/config`.
2. Tools are fetched from `GET /api/tools`, either all at once or per server.
3. The deny list is loaded from `GET /api/settings-local` to mark disabled tools.
4. Each tool is displayed as a card with its name, server origin, description, and toggle state.
5. When you disable a tool, its MCP identifier (`mcp__<server>__<tool>`) is added to `permissions.deny`.
6. Custom notes, tags, and description overrides are saved to localStorage under a key derived from the tool's full identifier.

## Tool Identifier Format

Tools follow the MCP naming convention:

```
mcp__<server-name>__<tool-name>
```

For example, a tool called `read_file` on the `filesystem` server becomes:

```
mcp__filesystem__read_file
```

## localStorage Data Structure

Custom metadata is stored per tool:

```json
{
  "tool_meta_mcp__filesystem__read_file": {
    "notes": "Use for reading config files only",
    "tags": ["filesystem", "read-only"],
    "descriptionOverride": "Reads a file from the local disk"
  }
}
```

## Screenshots

<!-- Add screenshots here -->
> _Screenshot: Tools list with server filter dropdown_

> _Screenshot: Tool detail card with notes and tags_

> _Screenshot: Search results across tools_

## Configuration Options

| Setting | Location | Description |
|---------|----------|-------------|
| `permissions.deny` | `settings.local.json` | Array of tool identifiers to block |
| Custom notes | localStorage | Free-text notes per tool |
| Custom tags | localStorage | String array of tags per tool |
| Description override | localStorage | Replaces the server-provided description |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No tools appearing | Ensure at least one MCP server is configured and running. Check the Servers page. |
| Tool count mismatch | Some servers may expose tools dynamically. Re-fetch tools to update. |
| Deny list not saving | Check that the backend can write to `settings.local.json`. Look for API errors in the console. |
| Custom notes disappeared | Notes are in localStorage. Clearing browser data removes them. Use export if you need backups. |
| Search returns no results | Search checks name, description, and tags. Verify your query matches any of these fields. |
| Tool toggle has no effect | The deny list blocks tools in Claude Code, not on the server. Restart Claude Code to apply changes. |
