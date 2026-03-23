# Slash Commands Reference

## Overview

The Slash Commands Reference page (`/commands`) is a searchable guide to all 20+ slash commands available in Claude Code. Commands are organized by category with descriptions, usage syntax, examples, and tips for each.

## Features

### Searchable Command List
A search bar at the top filters commands in real time as you type. Search matches against command names, descriptions, and category labels.

### Category Organization
Commands are grouped into four categories for easy browsing:
- **Session** -- Commands that manage the current conversation session.
- **Configuration** -- Commands that modify Claude Code settings and behavior.
- **Tools** -- Commands that control tool availability and permissions.
- **Memory** -- Commands that manage persistent memory and context files.

### Command Cards
Each command is displayed as a card containing:
- Command name with syntax highlighting
- Brief description of what it does
- Usage syntax with required and optional arguments
- Practical examples showing common use cases
- Tips and notes about behavior or limitations

## Commands by Category

### Session Commands
- `/clear` -- Clear the current conversation context and start fresh.
- `/resume` -- Resume a previous conversation by session ID.
- `/compact` -- Compress the current conversation to reduce token usage.
- `/cost` -- Display token usage and estimated cost for the current session.
- `/status` -- Show current session status including model, project, and token counts.
- `/quit` -- Exit Claude Code gracefully.

### Configuration Commands
- `/config` -- View or modify Claude Code configuration settings.
- `/model` -- Switch the active model (e.g., Opus, Sonnet, Haiku).
- `/permissions` -- View or modify tool permission settings.
- `/theme` -- Switch between light and dark terminal themes.
- `/verbose` -- Toggle verbose output mode for debugging.

### Tools Commands
- `/tools` -- List all available tools and their current status.
- `/allowed-tools` -- View and manage the tool allowlist.
- `/mcp` -- View MCP server connections and status.
- `/approve` -- Pre-approve specific tool patterns to skip confirmation prompts.
- `/deny` -- Block specific tools from being used in the session.

### Memory Commands
- `/memory` -- View the contents of the active CLAUDE.md memory file.
- `/memory-edit` -- Open the memory file for editing.
- `/memory-add` -- Append a note to the memory file.
- `/init` -- Initialize a new CLAUDE.md file in the current project.
- `/context` -- Add files or URLs to the conversation context.

## How It Works

This page is entirely static content. No API calls are made. The command data is embedded in the frontend at build time.

1. The page renders a pre-defined list of command objects, each containing the command name, category, description, usage, examples, and tips.
2. The search input filters commands client-side using simple string matching.
3. Category headers act as collapsible sections. All categories are expanded by default.
4. Command cards are styled with syntax highlighting for the command name and code formatting for usage and example blocks.

## API Endpoints

This page does not use any API endpoints. All content is static and bundled with the frontend.

## Troubleshooting

### Search returns no results
- Check for typos in your search query. Search matches partial strings, so even a few characters should find relevant commands.
- The search covers command names, descriptions, and categories. Try searching by what the command does rather than its exact name.

### Command does not work in Claude Code
- Some commands were introduced in specific Claude Code versions. Ensure you are running the latest version.
- Check that you are typing the command correctly with the leading `/` slash.
- Some commands require arguments; running them without arguments may show help text rather than executing.

### Missing commands
- The reference page shows commands available as of the dashboard's release date. New commands added to Claude Code in later versions may not appear here.
- Custom or plugin-provided commands are not included in this reference.

### Page does not load
- Since this page is static, loading issues are typically caused by build or deployment problems.
- Try a hard refresh (Ctrl+Shift+R) to clear the cache.
- Verify that the dashboard frontend assets are properly built and served.

### Categories appear collapsed
- JavaScript must be enabled for the collapsible sections to function.
- If all sections appear collapsed on load, check for JavaScript errors in the browser console.
