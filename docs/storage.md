# Storage Page

## Overview

The Storage page (`/storage`) provides a disk usage breakdown for the `~/.claude/` directory. It visualizes space consumption with a horizontal bar chart, color-coded by size thresholds, and shows file counts per directory.

This page helps identify which subdirectories are consuming the most disk space and whether cleanup may be needed.

---

## Features

| Feature | Description |
|---|---|
| **Horizontal Bar Chart** | Directories are displayed as horizontal bars, sorted by size (largest first). |
| **Color Coding** | Bars are color-coded: red (>50 MB), orange (>10 MB), green (<=10 MB). |
| **Formatted Sizes** | Sizes displayed in human-readable format (B, KB, MB, GB) with appropriate precision. |
| **File Count** | Each directory entry shows the total number of files it contains (recursive). |
| **Total Summary** | A summary row at the top shows the aggregate size and file count for the entire `~/.claude/` directory. |

---

## API Endpoints

### GET `/api/storage`

Returns disk usage data for all subdirectories within `~/.claude/`.

**Response Example:**

```json
{
  "total": {
    "size": 157286400,
    "formattedSize": "150.00 MB",
    "fileCount": 1247
  },
  "directories": [
    {
      "name": "plugins",
      "path": "C:\\Users\\user\\.claude\\plugins",
      "size": 83886080,
      "formattedSize": "80.00 MB",
      "fileCount": 842,
      "color": "red"
    },
    {
      "name": "projects",
      "path": "C:\\Users\\user\\.claude\\projects",
      "size": 15728640,
      "formattedSize": "15.00 MB",
      "fileCount": 203,
      "color": "orange"
    },
    {
      "name": "plans",
      "path": "C:\\Users\\user\\.claude\\plans",
      "size": 524288,
      "formattedSize": "512.00 KB",
      "fileCount": 12,
      "color": "green"
    }
  ]
}
```

**Response Fields:**

| Field | Type | Description |
|---|---|---|
| `total.size` | number | Total size in bytes |
| `total.formattedSize` | string | Human-readable total size |
| `total.fileCount` | number | Total number of files |
| `directories[].name` | string | Directory name |
| `directories[].path` | string | Absolute path to the directory |
| `directories[].size` | number | Directory size in bytes |
| `directories[].formattedSize` | string | Human-readable directory size |
| `directories[].fileCount` | number | Number of files in the directory |
| `directories[].color` | string | Color code: `red`, `orange`, or `green` |

---

## How It Works

1. **Directory Enumeration** — The server lists all immediate subdirectories of `~/.claude/`.
2. **Recursive Size Calculation** — For each subdirectory, it recursively walks the file tree, summing file sizes and counting files.
3. **Sorting** — Results are sorted by size in descending order (largest directories first).
4. **Color Assignment** — Each directory is assigned a color based on its total size:
   - **Red** (`#e74c3c`): Greater than 50 MB
   - **Orange** (`#f39c12`): Greater than 10 MB
   - **Green** (`#2ecc71`): 10 MB or less
5. **Size Formatting** — Raw byte values are converted to the most appropriate unit (B, KB, MB, GB).
6. **Chart Rendering** — The frontend renders horizontal bars with widths proportional to the largest directory's size.

---

## Color Thresholds

| Threshold | Color | Hex Code | Meaning |
|---|---|---|---|
| > 50 MB | Red | `#e74c3c` | Large — consider cleanup |
| > 10 MB | Orange | `#f39c12` | Moderate — monitor growth |
| <= 10 MB | Green | `#2ecc71` | Healthy size |

---

## Configuration Options

No configuration is required. The storage scanner always targets `~/.claude/` and includes all subdirectories.

### Directories Typically Found

| Directory | Contents |
|---|---|
| `plugins/` | Installed MCP server plugins and marketplace packages |
| `projects/` | Per-project configuration and CLAUDE.md files |
| `plans/` | Saved execution plans |
| `skills/` | Custom skill definitions |
| `backups/` | Configuration backup files |
| `cache/` | Temporary cached data |

---

## Troubleshooting

| Issue | Cause | Solution |
|---|---|---|
| Page shows no data | `~/.claude/` directory does not exist | Ensure Claude Code has been run at least once to initialize the directory. |
| Sizes seem inaccurate | Symlinks or junction points | The scanner follows real paths; symlinks may cause double-counting or missing data. |
| Scan is slow | Very large plugin directories | Large `node_modules` trees in plugins can slow the recursive scan. Wait for it to complete. |
| Directory missing from chart | Empty directory (0 bytes) | Directories with no files are included but may have a zero-width bar. |
| Permission errors | Restricted subdirectories | Ensure the dashboard server process has read access to all subdirectories under `~/.claude/`. |

---

## Related Pages

- [Plugins](./plugins.md) — Manage the plugins directory, often the largest consumer of storage.
- [Health](./health.md) — Verify directory existence as part of system health checks.
