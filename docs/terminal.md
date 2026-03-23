# Terminal

Embedded terminal inside the Claude Code Dashboard desktop app. Run Claude Code commands directly without switching to a separate terminal window.

## Features

- **Multi-tab support** — Open multiple terminal tabs, each running independently
- **Auto-run commands** — Resume and Run buttons from other pages open here and execute automatically
- **Full terminal emulation** — PowerShell on Windows, bash on macOS/Linux via node-pty
- **Dark theme** — Matches the dashboard's dark color scheme
- **Clickable links** — URLs in terminal output are clickable
- **Status bar** — Shows connection status and terminal dimensions

## How to Use

1. Click **Terminal** in the navigation bar
2. A new terminal tab opens automatically
3. Type commands as you would in any terminal
4. Click **+** to open additional tabs
5. Click **x** on a tab to close it

## Auto-Run from Other Pages

When you click **Run** or **Resume** on other pages (Homepage, Conversations, Models, Agents), the terminal page opens and the command runs automatically.

## Requirements

- Only available in the Electron desktop app (not the web version)
- Requires `node-pty` package installed
