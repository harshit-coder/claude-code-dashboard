# Plugins Page

## Overview

The Plugins page (`/plugins`) provides a read-only viewer for all installed Claude Code plugins. It scans the `~/.claude/plugins/` directory (including `marketplaces/` and `cache/` subdirectories) and displays each plugin as a card with metadata such as name, status, location, and size.

This page is intended for inspection only — plugins are managed externally or via the Marketplace page.

---

## Features

| Feature | Description |
|---|---|
| **Card View** | Each plugin is rendered as a card showing its name, status badge, file location, and formatted size. |
| **Enabled/Disabled Badge** | Visual indicator showing whether a plugin is currently active. |
| **Location Path** | Displays the full filesystem path to the plugin directory. |
| **Formatted Size** | Human-readable file size (B, KB, MB, GB). |
| **Marketplace Sources** | Lists extra known marketplaces configured in `settings.json` under `extraKnownMarketplaces`. |

---

## API Endpoints

### GET `/api/plugins`

Returns a JSON array of all discovered plugins.

**Response Example:**

```json
[
  {
    "name": "mcp-server-github",
    "enabled": true,
    "location": "C:\\Users\\user\\.claude\\plugins\\marketplaces\\mcp-server-github",
    "size": 2457600,
    "formattedSize": "2.34 MB",
    "source": "npm"
  }
]
```

**Response Fields:**

| Field | Type | Description |
|---|---|---|
| `name` | string | Plugin package name |
| `enabled` | boolean | Whether the plugin is active |
| `location` | string | Absolute path to the plugin directory |
| `size` | number | Size in bytes |
| `formattedSize` | string | Human-readable size string |
| `source` | string | Origin marketplace or source identifier |

---

## How It Works

1. **Directory Scan** — The server reads `~/.claude/plugins/`, including `marketplaces/` and `cache/` subdirectories.
2. **Metadata Extraction** — For each discovered plugin directory, the server reads `package.json` (if present) to extract name, version, and description.
3. **Size Calculation** — Recursively sums file sizes within each plugin directory.
4. **Status Detection** — Checks the main Claude Code configuration to determine if each plugin is enabled or disabled.
5. **Marketplace Enrichment** — Cross-references plugins with `extraKnownMarketplaces` from `settings.json` to identify the source marketplace.

---

## Configuration Options

### `settings.json` — Extra Marketplaces

Additional marketplace registries can be defined in `~/.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": [
    "https://custom-registry.example.com"
  ]
}
```

These marketplaces will appear as source labels on plugin cards.

### Plugin Directory Structure

```
~/.claude/plugins/
  marketplaces/
    mcp-server-github/
      package.json
      node_modules/
      ...
  cache/
    temp-plugin-data/
```

---

## Troubleshooting

| Issue | Cause | Solution |
|---|---|---|
| No plugins displayed | `~/.claude/plugins/` directory is empty or missing | Install plugins via the Marketplace page or manually place them in the plugins directory. |
| Plugin shows as disabled | Plugin is not referenced in the active configuration | Check `~/.claude.json` or `settings.json` for the plugin entry and ensure it is enabled. |
| Size shows 0 B | Empty plugin directory or permission error | Verify the plugin directory contains files and that the dashboard server has read access. |
| Missing marketplace source | Marketplace not in `extraKnownMarketplaces` | Add the marketplace URL to `settings.json` under `extraKnownMarketplaces`. |
| Stale plugin list | Cache not refreshed | Reload the page; the API re-scans on every request. |

---

## Related Pages

- [Marketplace](./marketplace.md) — Search and install new plugins from npm.
- [Storage](./storage.md) — View disk usage including the plugins directory.
- [Health](./health.md) — Verify that the plugins directory exists and is accessible.
