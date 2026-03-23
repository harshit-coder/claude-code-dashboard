# Agents Page

## Overview

The Agents page (`/agents`) lets you define custom agent configurations for Claude Code. Agents are specialized personas with a name, description, and system prompt that modify Claude Code's behavior for specific tasks. Agent configurations are stored in your browser's localStorage and can be exported or imported as JSON.

## Features

| Feature | Description |
|---------|-------------|
| **Create Agent** | Define a new agent with name, description, and prompt |
| **Edit Agent** | Modify an existing agent's configuration |
| **Delete Agent** | Remove an agent from localStorage |
| **CLI Command Generation** | Auto-generates the `claude --agents` CLI command |
| **Export as JSON** | Download agent configurations for sharing or backup |
| **Import from JSON** | Load agent configurations from a JSON file |
| **Preview Prompt** | View the full system prompt in a formatted preview |

## How It Works

1. Agents are stored in the browser's localStorage under a dedicated key.
2. Each agent has a name, description, and prompt that defines its behavior.
3. The dashboard generates the corresponding CLI command for using the agent.
4. You can export all agents as a JSON file for backup or sharing.
5. Importing a JSON file merges or replaces the current agent list.

### Agent Lifecycle

```
Create Agent -> Configure Prompt -> Copy CLI Command -> Use in Claude Code
```

## Agent Configuration

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Unique identifier for the agent (used in CLI) |
| `description` | string | Yes | Short description of the agent's purpose |
| `prompt` | string | Yes | System prompt that defines the agent's behavior and instructions |

### Example Agent

```json
{
  "name": "code-reviewer",
  "description": "Thorough code review specialist",
  "prompt": "You are an expert code reviewer. When reviewing code:\n\n1. Check for bugs and logic errors\n2. Evaluate code style and naming conventions\n3. Look for security vulnerabilities\n4. Suggest performance improvements\n5. Verify test coverage\n\nBe constructive, specific, and provide code examples for suggested changes."
}
```

## CLI Command Generation

The dashboard generates a ready-to-use CLI command for each agent:

```bash
claude --agents '{
  "name": "code-reviewer",
  "description": "Thorough code review specialist",
  "prompt": "You are an expert code reviewer..."
}'
```

You can copy this command directly and paste it into your terminal to start Claude Code with the agent's configuration.

## Export/Import Format

### Export

Exports all agents as a JSON array:

```json
[
  {
    "name": "code-reviewer",
    "description": "Thorough code review specialist",
    "prompt": "You are an expert code reviewer..."
  },
  {
    "name": "bug-hunter",
    "description": "Finds and fixes bugs",
    "prompt": "You are a bug hunting specialist..."
  }
]
```

### Import

Accepts a JSON file in the same format. Import behavior:

- **Merge**: Adds new agents, skips duplicates by name.
- **Replace**: Overwrites all existing agents with the imported set.

## localStorage Data Structure

Agents are stored under the `claude_agents` key:

```json
{
  "claude_agents": [
    {
      "id": "uuid-1234",
      "name": "code-reviewer",
      "description": "Thorough code review specialist",
      "prompt": "You are an expert code reviewer...",
      "createdAt": "2026-01-15T10:30:00Z",
      "updatedAt": "2026-03-20T14:22:00Z"
    }
  ]
}
```

## API Endpoints

The Agents page does **not** use backend API endpoints. All data is stored and managed client-side in localStorage. This means:

- No server configuration is required.
- Agents are specific to the browser and machine.
- Use export/import for portability across browsers or machines.

## Screenshots

<!-- Add screenshots here -->
> _Screenshot: Agent list with edit and delete actions_

> _Screenshot: Create/Edit agent form_

> _Screenshot: Generated CLI command with copy button_

> _Screenshot: Export/Import dialog_

## Use Cases

| Agent | Description | Example Prompt Focus |
|-------|-------------|---------------------|
| Code Reviewer | Reviews PRs and code changes | Style, bugs, security, tests |
| Bug Hunter | Finds and diagnoses bugs | Debugging strategy, root cause analysis |
| Refactorer | Improves code structure | DRY, SOLID, design patterns |
| Doc Writer | Creates documentation | API docs, READMEs, inline comments |
| Test Writer | Generates test cases | Unit tests, edge cases, mocking |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Agents disappeared | Agents are in localStorage. Clearing browser data removes them. Export regularly. |
| CLI command not working | Ensure you're using the correct shell quoting. Single quotes wrapping the JSON is recommended. |
| Import fails | Verify the JSON file is a valid array of agent objects with `name`, `description`, and `prompt` fields. |
| Agent name conflict on import | Choose "Replace" mode to overwrite, or rename the conflicting agent before importing. |
| Prompt too long for CLI | Very long prompts may hit shell argument limits. Consider using a file-based approach instead. |
| Changes not reflected in Claude | The `--agents` flag must be passed each time. Agents are not persisted in Claude Code's config. |
