# Permissions Page

## Overview

The Permissions page (`/permissions`) lets you manage the allow and deny lists in `settings.local.json`. These lists control which tools and commands Claude Code is permitted to use without asking for confirmation. This provides a security layer to prevent unintended actions.

## Features

| Feature | Description |
|---------|-------------|
| **View Allow List** | See all currently permitted tools and commands |
| **View Deny List** | See all currently blocked tools and commands |
| **Add Entry** | Add a new permission entry to either list |
| **Remove Entry** | Remove an entry from the allow or deny list |
| **Common Suggestions** | Quick-add buttons for frequently used permission patterns |
| **Bash Pattern Matching** | Support for glob-style patterns on Bash commands |
| **MCP Tool Format** | Standard `mcp__server__tool` identifier format |

## API Endpoints Used

### GET /api/settings-local

Loads the current `settings.local.json` file, which contains both permission lists.

```json
// Response
{
  "permissions": {
    "allow": [
      "Bash(git:*)",
      "Bash(npm:*)",
      "mcp__filesystem__read_file",
      "Read",
      "Glob"
    ],
    "deny": [
      "Bash(rm:*)",
      "mcp__filesystem__delete_file",
      "mcp__github__push"
    ]
  }
}
```

### POST /api/settings-local

Saves updated permission lists back to `settings.local.json`.

```json
// Request body
{
  "permissions": {
    "allow": [
      "Bash(git:*)",
      "Read"
    ],
    "deny": [
      "mcp__filesystem__delete_file"
    ]
  }
}
```

## How It Works

1. The page loads `settings.local.json` via `GET /api/settings-local`.
2. Allow and deny lists are displayed in separate sections.
3. Each entry appears as a removable chip/badge.
4. Adding an entry opens an input with autocomplete suggestions.
5. On any change, the full updated permissions object is sent via `POST /api/settings-local`.
6. Claude Code reads `settings.local.json` at startup and on each tool invocation.

## Permission Entry Formats

### Built-in Tools

Use the tool name directly:

```
Read
Write
Edit
Glob
Grep
Bash
```

### Bash with Pattern Matching

Restrict Bash permissions to specific command prefixes using `Bash(command:pattern)`:

```
Bash(git:*)           # Allow/deny all git commands
Bash(npm:install)     # Allow/deny only npm install
Bash(docker:*)        # Allow/deny all docker commands
Bash(rm:-rf *)        # Deny dangerous rm commands
Bash(curl:*)          # Allow/deny all curl commands
```

### MCP Tools

Use the `mcp__<server>__<tool>` format:

```
mcp__filesystem__read_file      # Specific tool on specific server
mcp__filesystem__*              # All tools on filesystem server
mcp__github__create_pull_request
mcp__context7__query-docs
```

## Common Entry Suggestions

The page provides quick-add buttons for frequently used entries:

| Category | Suggestions |
|----------|------------|
| **Git** | `Bash(git:*)`, `Bash(git:status)`, `Bash(git:diff)`, `Bash(git:log)` |
| **Package Managers** | `Bash(npm:*)`, `Bash(pip:*)`, `Bash(yarn:*)` |
| **File Operations** | `Read`, `Write`, `Edit`, `Glob`, `Grep` |
| **Safety Denials** | `Bash(rm:-rf *)`, `Bash(sudo:*)`, `mcp__*__delete*` |

## Allow vs Deny Precedence

- **Deny takes precedence** over allow when the same entry appears in both lists.
- If a tool is not in either list, Claude Code will prompt the user for confirmation.
- Adding a tool to the allow list grants automatic approval without prompting.
- Adding a tool to the deny list blocks it entirely.

## Screenshots

<!-- Add screenshots here -->
> _Screenshot: Allow and deny lists side by side_

> _Screenshot: Add entry with autocomplete suggestions_

> _Screenshot: Common suggestions quick-add panel_

## Configuration Options

| Field | Type | Description |
|-------|------|-------------|
| `permissions.allow` | string[] | Tools and commands that run without user confirmation |
| `permissions.deny` | string[] | Tools and commands that are blocked entirely |

## File Location

The permissions file is stored at:

```
~/.claude/settings.local.json
```

This file is local to your machine and should not be committed to version control.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Permission changes not taking effect | Restart Claude Code after modifying permissions. |
| Bash pattern not matching | Ensure the pattern follows `Bash(command:args)` syntax. The colon separates command from args. |
| Tool still prompting despite allow | Check that the entry matches exactly. MCP tools need the full `mcp__server__tool` format. |
| Cannot deny a built-in tool | Some core tools (like Read) may still be available in limited form even when denied. |
| Settings file is empty | The dashboard creates the file if missing. Check write permissions on `~/.claude/`. |
| Conflicting allow/deny entries | Deny takes precedence. Remove the deny entry if you want to allow the tool. |
