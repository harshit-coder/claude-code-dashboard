# Multi Console

Run multiple terminal sessions side by side in configurable layouts.

## Features

- **Layout modes** — Single, Split Horizontal, Split Vertical, Quad (2x2)
- **Independent panes** — Each pane runs its own terminal session
- **Broadcast Mode** — Type once, send to ALL panes simultaneously
- **Auto-resize** — Terminals adapt when you change layouts or resize the window

## Layouts

| Layout | Panes | Best for |
|--------|-------|----------|
| Single | 1 | Focused work on one project |
| Split H | 2 | Two projects side by side |
| Split V | 2 | Code on top, logs on bottom |
| Quad | 4 | Managing multiple projects at once |

## Broadcast Mode

Toggle the **Broadcast Mode** checkbox to send your keyboard input to ALL panes at the same time. Useful for:
- Running `git pull` across multiple projects
- Starting servers in parallel
- Running the same test command everywhere

## Requirements

- Only available in the Electron desktop app
- Requires `node-pty` package installed
