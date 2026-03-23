# Keybindings Page (`/keybindings`)

## Overview

The Keybindings page provides a visual editor for managing Claude Code keyboard shortcuts. All keybindings are stored in `~/.claude/keybindings.json` and follow a simple format of key combination, command, and optional context condition. The editor allows you to view, add, edit, and delete keybindings without manually editing JSON.

## Features

- **Table view** displaying all current keybindings
- **Add new keybinding** via a form with key, command, and when fields
- **Edit existing keybindings** inline in the table
- **Delete keybindings** with confirmation
- **Common defaults reference** panel showing standard keybindings
- **Load defaults button** to populate with recommended keybindings
- **Validation** to prevent duplicate key combinations

## How It Works

### Keybinding Format

Each keybinding is a JSON object with three fields:

```json
{
  "key": "ctrl+shift+p",
  "command": "commandPalette",
  "when": "editorFocus"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `key` | Yes | Key combination (e.g., `ctrl+k`, `alt+enter`, `ctrl+shift+s`) |
| `command` | Yes | Command identifier to execute |
| `when` | No | Context condition when the keybinding is active |

### Key Combination Syntax

Key combinations use `+` to join modifiers and keys:

| Modifier | Syntax | Platform |
|----------|--------|----------|
| Control | `ctrl` | All |
| Shift | `shift` | All |
| Alt | `alt` | All |
| Meta/Super | `meta` | macOS Command key |

Examples: `ctrl+s`, `ctrl+shift+enter`, `alt+d`, `meta+k`

### The `when` Clause

The `when` field defines context conditions for when a keybinding is active:

| Condition | Description |
|-----------|-------------|
| `editorFocus` | When the text editor has focus |
| `inputFocus` | When any input field has focus |
| `terminalFocus` | When the terminal panel has focus |
| (empty) | Always active regardless of context |

### Common Default Keybindings

The defaults reference panel shows standard keybindings:

| Key | Command | When |
|-----|---------|------|
| `ctrl+enter` | `submit` | `inputFocus` |
| `ctrl+c` | `cancel` | - |
| `ctrl+k` | `clearHistory` | - |
| `ctrl+l` | `clearScreen` | - |
| `ctrl+d` | `exit` | - |
| `escape` | `dismiss` | `inputFocus` |
| `up` | `previousHistory` | `inputFocus` |
| `down` | `nextHistory` | `inputFocus` |

### Load Defaults

Clicking the "Load Defaults" button populates `keybindings.json` with the standard set of keybindings shown above. If the file already contains custom bindings, a confirmation dialog warns that existing bindings will be replaced.

### Table View

The table displays all keybindings with columns:

| Column | Description |
|--------|-------------|
| Key | The keyboard shortcut displayed as styled key caps |
| Command | The command identifier |
| When | The context condition (shown as a badge or "Always") |
| Actions | Edit and Delete buttons |

## API Endpoints

### `GET /api/keybindings`

Returns the current keybindings configuration.

**Response:**

```json
{
  "keybindings": [
    { "key": "ctrl+enter", "command": "submit", "when": "inputFocus" },
    { "key": "ctrl+c", "command": "cancel" },
    { "key": "escape", "command": "dismiss", "when": "inputFocus" }
  ]
}
```

### `POST /api/keybindings`

Saves the full keybindings array to `~/.claude/keybindings.json`.

**Request body:**

```json
{
  "keybindings": [
    { "key": "ctrl+enter", "command": "submit", "when": "inputFocus" },
    { "key": "ctrl+c", "command": "cancel" }
  ]
}
```

**Response:**

```json
{
  "success": true
}
```

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| Config file | `~/.claude/keybindings.json` | Path to the keybindings JSON file |

## Troubleshooting

- **File not found on first use:** The file is created automatically when you save keybindings for the first time, or click "Load Defaults".
- **Duplicate key warning:** Two keybindings cannot share the same `key` + `when` combination. Edit or remove the conflicting entry.
- **Keybinding not working in Claude:** Restart Claude Code after saving changes for new keybindings to take effect.
- **Invalid key combination:** Ensure modifiers and keys are separated by `+` with no spaces (e.g., `ctrl+s` not `ctrl + s`).
- **JSON parse error:** If the file was manually edited and contains syntax errors, the API will return an error. Fix the JSON or use "Load Defaults" to reset.
- **Changes not persisting:** Verify write permissions on `~/.claude/keybindings.json` and its parent directory.
