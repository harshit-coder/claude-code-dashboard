# Agent Runner

Queue and run Claude Code prompts in the background without watching them.

## Features

- **Prompt queue** — Add multiple prompts, they run one at a time automatically
- **Working directory** — Specify which project directory each prompt runs in
- **Live status** — See queued, running, completed, and failed tasks
- **Output viewer** — Click to expand and see the full output of completed tasks
- **Cancel support** — Cancel queued or running tasks
- **History** — Past runs are saved and viewable
- **Notifications** — Desktop notification when a task completes or fails

## How to Use

1. Go to **Terminal > Agent Runner** in the navigation
2. Type your prompt in the text area (e.g., "Fix the login bug in auth.js")
3. Optionally set a working directory (the project folder)
4. Click **Queue Task**
5. The task starts running automatically
6. View output by clicking **View Output** on completed tasks

## Use Cases

- Run long code generation tasks without watching
- Queue multiple refactoring prompts for different files
- Batch processing across projects
- Overnight code reviews

## Keyboard Shortcut

Press **Ctrl+Enter** in the prompt field to queue the task quickly.

## Requirements

- Only available in the Electron desktop app
- Claude Code CLI must be installed and accessible in PATH
