# Hooks Page

## Overview

The Hooks page (`/hooks`) provides a visual editor for Claude Code event hooks stored in `settings.json`. Hooks let you run shell commands or LLM prompts automatically in response to specific Claude Code lifecycle events, enabling custom automation and validation workflows.

## Features

| Feature | Description |
|---------|-------------|
| **Add Hook** | Create a new hook for any supported event type |
| **Edit Hook** | Modify an existing hook's configuration |
| **Delete Hook** | Remove a hook from `settings.json` |
| **Event Type Selector** | Choose which lifecycle event triggers the hook |
| **Matcher Configuration** | Restrict hooks to specific tools by name pattern |
| **Timeout Setting** | Configure maximum execution time for hook commands |
| **Variable Placeholders** | Insert dynamic variables like `$TOOL_NAME` into commands |
| **Hook Type Toggle** | Switch between shell command and LLM prompt types |

## Event Types

| Event | Trigger | Available Variables |
|-------|---------|-------------------|
| `PreToolUse` | Before a tool is executed | `$TOOL_NAME`, `$ARGUMENTS` |
| `PostToolUse` | After a tool completes successfully | `$TOOL_NAME`, `$ARGUMENTS`, `$OUTPUT` |
| `PostToolUseFailure` | After a tool execution fails | `$TOOL_NAME`, `$ARGUMENTS`, `$ERROR` |
| `Notification` | When Claude Code sends a notification | `$MESSAGE` |
| `Stop` | When the main agent stops | `$OUTPUT` |
| `SubagentStop` | When a sub-agent stops | `$OUTPUT` |

## Hook Types

### Command (Shell)

Runs a shell command. The exit code determines the hook's effect:

- **Exit 0**: Hook passes, execution continues normally.
- **Non-zero exit**: Hook fails. For `PreToolUse`, this blocks the tool from running.

```json
{
  "type": "command",
  "command": "echo '$TOOL_NAME' >> /tmp/tool-log.txt"
}
```

### Prompt (LLM)

Sends a prompt to the LLM for evaluation. Useful for semantic checks.

```json
{
  "type": "prompt",
  "prompt": "Check if the arguments to $TOOL_NAME look safe: $ARGUMENTS"
}
```

## API Endpoints Used

### GET /api/hooks

Retrieves all hooks from `settings.json`.

```json
// Response
{
  "hooks": {
    "PreToolUse": [
      {
        "type": "command",
        "command": "echo 'Using $TOOL_NAME'",
        "matcher": "Bash",
        "timeout": 5000
      }
    ],
    "PostToolUse": []
  }
}
```

### POST /api/hooks

Saves the full hooks configuration to `settings.json`.

```json
// Request body
{
  "hooks": {
    "PreToolUse": [
      {
        "type": "command",
        "command": "echo 'Using $TOOL_NAME'",
        "matcher": "Bash",
        "timeout": 5000
      }
    ]
  }
}
```

## How It Works

1. The page loads all hooks via `GET /api/hooks`.
2. Hooks are grouped by event type and displayed in collapsible sections.
3. Each hook card shows its type, command/prompt, matcher, and timeout.
4. Adding or editing a hook opens a form with fields for type, command/prompt, matcher, and timeout.
5. Variable placeholders can be inserted via buttons or typed manually.
6. On save, the complete hooks object is sent via `POST /api/hooks`.

## Variable Placeholders

| Variable | Description | Available In |
|----------|-------------|-------------|
| `$TOOL_NAME` | Name of the tool being used | PreToolUse, PostToolUse, PostToolUseFailure |
| `$ARGUMENTS` | JSON string of tool arguments | PreToolUse, PostToolUse, PostToolUseFailure |
| `$OUTPUT` | Tool output or agent final output | PostToolUse, Stop, SubagentStop |
| `$ERROR` | Error message from failed tool | PostToolUseFailure |
| `$MESSAGE` | Notification message content | Notification |

## Configuration Options

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `type` | string | Yes | — | `"command"` or `"prompt"` |
| `command` | string | Conditional | — | Shell command (required when type is `command`) |
| `prompt` | string | Conditional | — | LLM prompt (required when type is `prompt`) |
| `matcher` | string | No | `*` (all) | Tool name pattern to match (e.g., `Bash`, `mcp__*`) |
| `timeout` | number | No | 10000 | Max execution time in milliseconds |

## Screenshots

<!-- Add screenshots here -->
> _Screenshot: Hooks grouped by event type_

> _Screenshot: Hook editor form with variable insertion_

> _Screenshot: Matcher configuration dropdown_

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Hook not triggering | Verify the event type and matcher pattern match the expected tool. |
| Command times out | Increase the `timeout` value or optimize the shell command. |
| Variables not expanding | Ensure you use the `$VARIABLE` syntax exactly. Variables are case-sensitive. |
| PreToolUse blocks everything | Check the matcher -- a wildcard `*` matches all tools. Narrow it to specific tools. |
| Hook saves but no effect | Restart Claude Code after modifying hooks for changes to take effect. |
| Permission denied on command | Ensure the shell command is executable and paths are absolute. |
