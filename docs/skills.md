# Skills Page

## Overview

The Skills page (`/skills`) lets you manage custom Claude Code slash commands. Skills are Markdown files stored in `~/.claude/skills/` and registered in `settings.json`. Each skill defines a reusable prompt or instruction set that can be invoked as a `/command-name` in Claude Code.

## Features

| Feature | Description |
|---------|-------------|
| **Create Skill** | Write a new skill with a name, description, and Markdown content |
| **Edit Skill** | Modify an existing skill's content or metadata |
| **Delete Skill** | Remove a skill file and its registration from settings |
| **Detect Orphan Files** | Find `.md` files in the skills directory that are not registered in `settings.json` |
| **Register Unregistered** | One-click registration of orphan skill files |
| **View Command Name** | See the `/command-name` that invokes each skill |
| **Preview Content** | View the Markdown content of any skill inline |

## API Endpoints Used

### GET /api/skills

Returns all registered skills with their metadata and file content.

```json
// Response
{
  "skills": [
    {
      "name": "review-pr",
      "description": "Review a pull request thoroughly",
      "path": "~/.claude/skills/review-pr.md",
      "command": "/review-pr",
      "content": "# PR Review Skill\n\nWhen reviewing a PR..."
    }
  ],
  "orphans": [
    {
      "filename": "old-skill.md",
      "path": "~/.claude/skills/old-skill.md"
    }
  ]
}
```

### POST /api/skills/save

Creates or updates a skill. Writes the `.md` file and updates `settings.json`.

```json
// Request body
{
  "name": "review-pr",
  "description": "Review a pull request thoroughly",
  "content": "# PR Review Skill\n\nWhen reviewing a PR, check for:\n- Code quality\n- Test coverage\n- Security issues"
}
```

### POST /api/skills/delete

Removes a skill file and its entry from `settings.json`.

```json
// Request body
{
  "name": "review-pr"
}
```

## How It Works

1. On load, `GET /api/skills` retrieves all registered skills and detects orphan files.
2. Skills are displayed as cards showing the command name, description, and a preview toggle.
3. Creating a skill writes a `.md` file to `~/.claude/skills/` and adds an entry to `settings.json`.
4. The skill's filename (without extension) becomes its slash command name.
5. Orphan detection compares files in `~/.claude/skills/` against entries in `settings.json`.
6. Registering an orphan adds the missing entry to `settings.json` without modifying the file.

## Skill File Structure

Each skill is a Markdown file in `~/.claude/skills/`:

```
~/.claude/skills/
  review-pr.md
  commit.md
  refactor.md
```

### Example Skill File

```markdown
# Code Review

When asked to review code, follow these steps:

1. Check for correctness and logic errors
2. Evaluate naming conventions and code style
3. Look for potential security vulnerabilities
4. Suggest performance improvements
5. Verify error handling is adequate

Be constructive and specific in your feedback.
```

## Registration in settings.json

Skills are registered under the `skills` key:

```json
{
  "skills": {
    "review-pr": {
      "description": "Review a pull request thoroughly",
      "path": "~/.claude/skills/review-pr.md"
    }
  }
}
```

## Screenshots

<!-- Add screenshots here -->
> _Screenshot: Skills list with command names_

> _Screenshot: Create/Edit skill form_

> _Screenshot: Orphan file detection banner_

## Configuration Options

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Becomes the slash command (e.g., `review-pr` -> `/review-pr`) |
| `description` | Yes | Short description shown in skill listings and help |
| `content` | Yes | Markdown content defining the skill's instructions |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Skill not appearing in Claude Code | Ensure the skill is registered in `settings.json`. Use the dashboard to re-register. |
| Orphan files detected | These are `.md` files in the skills folder not listed in `settings.json`. Register or delete them. |
| Slash command not recognized | Verify the skill name contains only letters, numbers, and hyphens. Restart Claude Code. |
| Content not saving | Check write permissions on `~/.claude/skills/` directory. |
| Duplicate skill name | Skill names must be unique. Rename one of the conflicting skills. |
| Special characters in name | Avoid spaces and special characters. Use hyphens for word separation. |
