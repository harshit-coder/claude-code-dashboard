# Health Page

## Overview

The Health page (`/health`) performs a comprehensive system health check for your Claude Code installation. It validates configuration files, checks credential expiry, verifies directory structures, and reports MCP server counts. The results are displayed as a status dashboard with an overall health banner.

---

## Features

| Feature | Description |
|---|---|
| **Overall Status Banner** | A prominent banner showing the aggregate health status: "Healthy" (green), "Warning" (yellow), or "Error" (red). |
| **Auto-Refresh** | Health checks automatically re-run on a configurable interval to keep the status current. |
| **Export Config Button** | Download a ZIP archive of all current configuration files for backup or sharing. |
| **System Info** | Displays system metadata: OS, Claude Code version, home directory, and config paths. |
| **Individual Check Cards** | Each health check is displayed as a card with pass/fail status and details. |

---

## Health Checks

### Config File Validity

Validates that core configuration files exist and contain valid JSON.

| File | Path | Check |
|---|---|---|
| `claude.json` | `~/.claude.json` | Exists and parses as valid JSON |
| `settings.json` | `~/.claude/settings.json` | Exists and parses as valid JSON |
| `settings.local.json` | `~/.claude/settings.local.json` | Exists and parses as valid JSON |

### OAuth Credentials Expiry

Checks OAuth tokens stored in the configuration for expiration status.

- **Pass**: Token expires more than 24 hours from now.
- **Warning**: Token expires within 24 hours.
- **Fail**: Token is expired or missing.

### Stats Cache Freshness

Verifies that cached usage statistics are recent.

- **Pass**: Cache updated within the last hour.
- **Warning**: Cache is 1-24 hours old.
- **Fail**: Cache is more than 24 hours old or missing.

### Directory Existence

Confirms that expected directories exist under `~/.claude/`.

| Directory | Expected Path |
|---|---|
| `skills/` | `~/.claude/skills/` |
| `plans/` | `~/.claude/plans/` |
| `plugins/` | `~/.claude/plugins/` |
| `projects/` | `~/.claude/projects/` |

### MCP Server Counts

Reports the number of configured MCP servers across all scopes.

- Counts servers defined in `settings.json` (global scope).
- Counts servers defined in `settings.local.json` (local scope).
- Counts servers defined in project-level `.mcp.json` files.

---

## API Endpoints

### GET `/api/health`

Returns the full health check report.

**Response Example:**

```json
{
  "overall": "healthy",
  "timestamp": "2026-03-22T10:15:00.000Z",
  "system": {
    "os": "win32",
    "homeDir": "C:\\Users\\user",
    "claudeDir": "C:\\Users\\user\\.claude"
  },
  "checks": [
    {
      "name": "Config: claude.json",
      "category": "config",
      "status": "pass",
      "message": "Valid JSON, 4.2 KB"
    },
    {
      "name": "OAuth Credentials",
      "category": "credentials",
      "status": "warning",
      "message": "Token expires in 18 hours"
    },
    {
      "name": "Directory: plugins/",
      "category": "directory",
      "status": "pass",
      "message": "Exists, 842 files"
    },
    {
      "name": "MCP Servers",
      "category": "mcp",
      "status": "pass",
      "message": "12 servers configured (8 global, 3 local, 1 project)"
    }
  ]
}
```

**Overall Status Logic:**

| Condition | Overall Status |
|---|---|
| All checks pass | `healthy` |
| Any check has a warning (none failed) | `warning` |
| Any check has failed | `error` |

### GET `/api/export`

Downloads a ZIP archive of all current configuration files.

**Response:** Binary ZIP file with `Content-Disposition: attachment` header.

---

## How It Works

1. **File Validation** — Each config file is read from disk. If the file exists and parses as valid JSON, it passes. Missing files or parse errors result in a fail.
2. **Credential Inspection** — OAuth tokens are decoded (JWT) to extract the `exp` claim. The remaining time is compared against warning and failure thresholds.
3. **Cache Check** — The `mtime` of the stats cache file is compared to the current time to determine freshness.
4. **Directory Scan** — Each expected directory is checked with a filesystem `stat` call. Existence and readability are verified.
5. **MCP Counting** — Configuration files are parsed to extract `mcpServers` objects. Keys are counted per scope.
6. **Aggregation** — Individual results are combined into the overall status using the worst-status-wins rule.

---

## Configuration Options

### Auto-Refresh Interval

The page automatically refreshes health data. The default interval is 30 seconds. This is controlled client-side and can be adjusted in the page source.

### Export Contents

The export ZIP includes:

- `~/.claude.json`
- `~/.claude/settings.json`
- `~/.claude/settings.local.json`

---

## Troubleshooting

| Issue | Cause | Solution |
|---|---|---|
| Overall status shows "Error" | One or more critical checks failed | Review individual check cards to identify the failing check. |
| Config file marked invalid | Malformed JSON in the file | Open the file in an editor, fix syntax errors, and reload the page. |
| OAuth shows expired | Token has not been refreshed | Re-authenticate with Claude Code by running `claude auth`. |
| Directory missing | Claude Code not fully initialized | Run Claude Code once to generate default directories, or create them manually. |
| MCP count is 0 | No servers configured | Add MCP servers via `settings.json` or the Marketplace page. |
| Auto-refresh not working | Browser tab inactive or JavaScript error | Check the browser console for errors. Reload the page. |

---

## Related Pages

- [Backups](./backups.md) — Restore configurations if health checks reveal corruption.
- [Storage](./storage.md) — Investigate disk usage for directories reported in health checks.
- [Plugins](./plugins.md) — View installed plugins counted in the MCP server check.
