# Backups Page

## Overview

The Backups page (`/backups`) allows you to view, inspect, and restore configuration backups for Claude Code. It scans multiple locations for backup files and presents them in a card grid with status indicators, content preview, and one-click restore functionality.

---

## Features

| Feature | Description |
|---|---|
| **Card Grid Layout** | Backups displayed as cards with metadata at a glance. |
| **Valid/Invalid Badges** | Each backup is validated (JSON parse check) and marked with a green "Valid" or red "Invalid" badge. |
| **Type Badges** | Cards show a type badge: `config` (claude.json backups), `backup` (dedicated backup files), or `settings` (settings.json backups). |
| **View Content** | Click to preview the full JSON content of any backup file. |
| **Restore with Confirmation** | Restore a backup to its original location after a confirmation dialog to prevent accidental overwrites. |
| **Export All Configs** | Download a ZIP archive containing all current configuration files. |

---

## Backup Sources

The page scans the following locations:

| Pattern / Path | Type | Description |
|---|---|---|
| `~/.claude.json.*` | config | Timestamped snapshots of the main config file |
| `~/.claude/backups/` | backup | Dedicated backup directory with versioned files |
| `settings.json.backup` | settings | Backup of `~/.claude/settings.json` |
| `settings.local.json.backup` | settings | Backup of `~/.claude/settings.local.json` |

---

## API Endpoints

### GET `/api/backups`

Returns a list of all discovered backup files with metadata.

**Response Example:**

```json
[
  {
    "filename": ".claude.json.2026-03-20",
    "path": "C:\\Users\\user\\.claude.json.2026-03-20",
    "type": "config",
    "valid": true,
    "size": 4096,
    "formattedSize": "4.00 KB",
    "modified": "2026-03-20T14:30:00.000Z"
  }
]
```

### POST `/api/backups/content`

Retrieves the full content of a specific backup file.

**Request Body:**

```json
{
  "path": "C:\\Users\\user\\.claude.json.2026-03-20"
}
```

**Response:**

```json
{
  "content": "{ ... raw JSON content ... }",
  "valid": true
}
```

### POST `/api/backups/restore`

Restores a backup file to its original location. Creates a new backup of the current file before overwriting.

**Request Body:**

```json
{
  "path": "C:\\Users\\user\\.claude.json.2026-03-20"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Backup restored successfully. Previous config saved as .claude.json.pre-restore"
}
```

### GET `/api/export`

Downloads a ZIP archive of all current configuration files (not backups).

**Response:** Binary ZIP file with `Content-Disposition: attachment` header.

---

## How It Works

1. **Discovery** — The server scans `~/.claude.json.*` glob patterns, the `~/.claude/backups/` directory, and known settings backup paths.
2. **Validation** — Each file is read and parsed as JSON. Files that parse successfully are marked `valid`; others are marked `invalid`.
3. **Type Classification** — Files are categorized based on their filename pattern and location.
4. **Restore Safety** — Before restoring, the server copies the current active config to a `.pre-restore` suffixed file, then overwrites with the backup content.
5. **Export** — The export endpoint collects `claude.json`, `settings.json`, and `settings.local.json`, compresses them into a ZIP, and streams the response.

---

## Configuration Options

No additional configuration is required. The backup scanner uses hardcoded paths relative to the user's home directory (`~/.claude/`).

To create manual backups, simply copy config files with a descriptive suffix:

```bash
cp ~/.claude.json ~/.claude.json.manual-2026-03-22
```

These will be automatically discovered on the next page load.

---

## Troubleshooting

| Issue | Cause | Solution |
|---|---|---|
| No backups found | No backup files exist yet | Backups are created automatically during config changes. You can also create manual copies. |
| Backup shows "Invalid" | File contains malformed JSON | Open the file in a text editor and fix syntax errors, or delete the corrupted backup. |
| Restore fails | Permission denied or file locked | Ensure Claude Code is not actively writing to the config file. Check file permissions. |
| Export ZIP is empty | No config files found at expected paths | Verify that `~/.claude.json` and `~/.claude/settings.json` exist. |
| Old backups missing | Files were cleaned up or moved | Check `~/.claude/backups/` manually. The scanner only finds files matching expected patterns. |

---

## Related Pages

- [Health](./health.md) — Verify config file validity as part of system health checks.
- [Storage](./storage.md) — See how much disk space backups consume.
