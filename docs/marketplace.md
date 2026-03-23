# Marketplace Page

## Overview

The Marketplace page (`/marketplace`) allows you to search, preview, install, and uninstall MCP (Model Context Protocol) servers from the npm registry. It uses a server-side proxy to query npm, avoiding CORS restrictions in the browser. Installed packages are detected automatically and marked with a badge.

---

## Features

| Feature | Description |
|---|---|
| **Live npm Search** | Real-time search against the npm registry via a server-side proxy. |
| **Quick Filter Chips** | Pre-defined filter buttons for common categories: Official, GitHub, Database, AI, Browser, File System, Docker, Kubernetes, and more. |
| **Package Cards** | Each result displayed as a card with name, version, description, publisher, last publish date, and links (npm, repository). |
| **Installed Badge** | Packages already installed locally are flagged with an "Installed" badge on their card. |
| **One-Click Install** | Install a package with configurable name, command, arguments, and environment variables. |
| **README Preview** | View the full README of any package before installing. |
| **Uninstall with Confirmation** | Remove installed packages after a confirmation dialog. |
| **Load More Pagination** | Incrementally load additional search results beyond the initial page. |

---

## Quick Filter Chips

Clicking a chip sets the search query to a predefined term:

| Chip Label | Search Query |
|---|---|
| Official | `@anthropic mcp` |
| GitHub | `mcp github` |
| Database | `mcp database` |
| AI | `mcp ai` |
| Browser | `mcp browser` |
| File System | `mcp filesystem` |
| Docker | `mcp docker` |
| Kubernetes | `mcp kubernetes` |
| Search | `mcp search` |
| Memory | `mcp memory` |

---

## API Endpoints

### GET `/api/npm/search`

Searches the npm registry for packages matching a query.

**Query Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `q` | string | (required) | Search query string |
| `from` | number | `0` | Offset for pagination |
| `size` | number | `20` | Number of results to return |

**Response Example:**

```json
{
  "objects": [
    {
      "package": {
        "name": "@anthropic/mcp-server-github",
        "version": "1.2.3",
        "description": "GitHub MCP server for Claude Code",
        "publisher": { "username": "anthropic" },
        "date": "2026-03-15T08:00:00.000Z",
        "links": {
          "npm": "https://www.npmjs.com/package/@anthropic/mcp-server-github",
          "repository": "https://github.com/anthropics/mcp-server-github"
        }
      },
      "installed": false
    }
  ],
  "total": 156
}
```

### GET `/api/npm/package`

Retrieves full package metadata including the README.

**Query Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `name` | string | Full package name (e.g., `@anthropic/mcp-server-github`) |

**Response Example:**

```json
{
  "name": "@anthropic/mcp-server-github",
  "version": "1.2.3",
  "description": "GitHub MCP server for Claude Code",
  "readme": "# MCP Server GitHub\n\n...",
  "installed": true
}
```

### POST `/api/marketplace/install`

Installs an MCP server package and registers it in settings.

**Request Body:**

```json
{
  "name": "@anthropic/mcp-server-github",
  "command": "npx",
  "args": ["-y", "@anthropic/mcp-server-github"],
  "env": {
    "GITHUB_TOKEN": "ghp_xxxxxxxxxxxx"
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Package @anthropic/mcp-server-github installed successfully"
}
```

### POST `/api/marketplace/uninstall`

Removes an installed MCP server package and deregisters it from settings.

**Request Body:**

```json
{
  "name": "@anthropic/mcp-server-github"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Package @anthropic/mcp-server-github uninstalled successfully"
}
```

---

## How It Works

1. **Search Proxy** — The frontend sends search queries to `/api/npm/search`, which forwards them to the npm registry API (`https://registry.npmjs.org/-/v1/search`) to avoid browser CORS restrictions.
2. **Installed Detection** — After fetching npm results, the server cross-references package names against locally installed plugins in `~/.claude/plugins/` and MCP servers in `settings.json`.
3. **Install Flow** — When installing, the server runs `npm install` in the plugins directory, then adds the MCP server entry to `~/.claude/settings.json` under `mcpServers` with the provided command, args, and env.
4. **Uninstall Flow** — The server removes the package directory from `~/.claude/plugins/` and deletes the corresponding entry from `mcpServers` in `settings.json`.
5. **Pagination** — The `from` parameter offsets into the npm search results, allowing "Load More" to fetch the next batch.

---

## Install Configuration

When installing a package, you can configure:

| Field | Required | Description |
|---|---|---|
| `name` | Yes | npm package name to install |
| `command` | Yes | Command to run the server (e.g., `npx`, `node`) |
| `args` | No | Array of command-line arguments |
| `env` | No | Object of environment variables (e.g., API keys, tokens) |

**Example — Install with environment variables:**

```json
{
  "name": "mcp-server-postgres",
  "command": "npx",
  "args": ["-y", "mcp-server-postgres"],
  "env": {
    "DATABASE_URL": "postgresql://user:pass@localhost:5432/mydb"
  }
}
```

---

## Troubleshooting

| Issue | Cause | Solution |
|---|---|---|
| Search returns no results | npm registry unreachable or query too specific | Check internet connectivity. Try broader search terms. |
| "Installed" badge missing | Package installed under a different name | Check `~/.claude/settings.json` for the exact MCP server name. |
| Install fails | npm not found or network error | Ensure Node.js and npm are installed and accessible in the system PATH. |
| Uninstall does not remove files | Permission error or directory lock | Close any processes using the plugin and try again. Manually delete the directory if needed. |
| README not loading | Package has no README on npm | Not all packages publish a README. This is expected behavior. |
| CORS errors in browser console | Direct npm API calls from frontend | Ensure all requests go through the `/api/npm/` proxy endpoints, not directly to npm. |

---

## Related Pages

- [Plugins](./plugins.md) — View all installed plugins including those installed via Marketplace.
- [Health](./health.md) — Check MCP server counts and configuration validity.
- [Storage](./storage.md) — Monitor disk usage after installing new packages.
