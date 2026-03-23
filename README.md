# Claude Code Dashboard

The most comprehensive web dashboard for managing [Claude Code](https://docs.anthropic.com/en/docs/claude-code) — 26 pages, 53+ features, zero dependencies.

![Node.js](https://img.shields.io/badge/Node.js-16%2B-green) ![License](https://img.shields.io/badge/License-MIT-blue) ![Pages](https://img.shields.io/badge/Pages-26-purple) ![Tests](https://img.shields.io/badge/Tests-102%20passing-brightgreen) ![Dependencies](https://img.shields.io/badge/Dependencies-0-orange)

## Quick Start

```bash
git clone https://github.com/YOUR_USERNAME/claude-code-dashboard.git
cd claude-code-dashboard
node mcp-manager-server.js
# Open http://localhost:3456
```

Or via npx (after publishing to npm):
```bash
npx claude-code-dashboard
```

## What It Does

Claude Code stores everything locally — configs, conversations, usage stats, file history, telemetry — but it's all buried in JSON/JSONL files nobody reads. This dashboard surfaces **all of it** through a beautiful web UI.

**One command. 26 pages. Zero dependencies.**

## Pages

### MCP Management
| Page | Route | Description |
|------|-------|-------------|
| **Servers** | `/` | Add/edit/enable/disable MCP servers, ping test, watchdog monitor, sort by speed |
| **Tools** | `/tools` | Browse tools per server, enable/disable individual tools, custom notes/tags, token impact analyzer |
| **Marketplace** | `/marketplace` | Search npm for MCP servers, one-click install, auto-detect env vars from README |

### Configuration
| Page | Route | Description |
|------|-------|-------------|
| **Skills** | `/skills` | Create/edit/delete custom slash commands |
| **Hooks** | `/hooks` | Visual editor for event hooks (PreToolUse, PostToolUse, etc.) |
| **Permissions** | `/permissions` | Allow/deny lists with Dev/Safe/Custom preset profiles |
| **Agents** | `/agents` | Define custom agents with CLI command generator |
| **Keybindings** | `/keybindings` | Visual keyboard shortcut editor |

### Analytics & Costs
| Page | Route | Description |
|------|-------|-------------|
| **Usage** | `/usage` | Activity charts, hourly heatmap, model breakdown, context monitor |
| **Costs** | `/costs` | Token costs with live currency conversion (INR/EUR/GBP), burn rate, rate limit predictor |
| **Conversations** | `/conversations` | Chat-style replay of past sessions, export as .md, token stats, files changed |
| **Sessions** | `/sessions` | Browse all sessions with topic, sortable, click to open conversation |

### Content & Knowledge
| Page | Route | Description |
|------|-------|-------------|
| **CLAUDE.md** | `/docs` | Find and edit CLAUDE.md files across all projects |
| **Memories** | `/memory` | Browse/edit auto-memory files per project |
| **Plans & Todos** | `/plans` | View saved plans and todo items |
| **Prompts** | `/prompts` | Save/rate/reuse prompts, import from chat history |
| **Commands** | `/commands` | Searchable reference of all 20+ slash commands |

### System & Diagnostics
| Page | Route | Description |
|------|-------|-------------|
| **Health & Doctor** | `/health` | System checks, account badge, config validator, MCP auth status |
| **Storage** | `/storage` | Disk usage breakdown with color-coded bars |
| **Backups** | `/backups` | View/restore config backups, export all configs |
| **Plugins** | `/plugins` | Installed plugins viewer with sizes |
| **Debug Logs** | `/debug` | Log viewer with level filtering, common errors analysis |
| **File Changes** | `/changes` | File revision diffs, copy content, rollback/save-as |

### Privacy & Internals
| Page | Route | Description |
|------|-------|-------------|
| **Paste History** | `/pastes` | Search everything you've ever pasted into Claude |
| **Privacy Audit** | `/privacy` | See what telemetry is collected, MCP auth status, privacy tips |
| **Feature Flags** | `/flags` | View Statsig experiments and feature flags on your account |

## Key Features

### No Other Tool Has These
- **Paste History Search** — recover any code snippet you ever pasted
- **Privacy & Telemetry Audit** — see exactly what data Anthropic collects
- **Feature Flags Viewer** — see hidden experiments enabled on your account
- **MCP Server Ping + Watchdog** — test connections, auto-monitor every 60s
- **Token Impact Analyzer** — see how many tokens your MCP servers consume
- **Config Doctor** — deep validation with fix suggestions for common issues
- **Conversation Replay** — chat-style viewer with thinking blocks and tool calls
- **Cost Calculator + Currency Conversion** — live INR/EUR/GBP rates
- **Permission Profiles** — one-click Dev/Safe mode
- **Import Prompts from History** — auto-discover your most-used prompts
- **Common Error Patterns** — find recurring issues across all debug logs

### Technical Highlights
- **Zero dependencies** — pure Node.js, no frameworks
- **No build step** — just `node mcp-manager-server.js`
- **102 automated tests** — all passing
- **Cross-platform** — Windows, macOS, Linux
- **40+ API endpoints** — all documented
- **Grouped dropdown navigation** — 6 categories, always accessible
- **Dark theme** — consistent across all 26 pages
- **Auto-backup** — before every config write

## Navigation

The dashboard uses a grouped dropdown navbar:

```
MCP          → Servers, Tools, Marketplace
Config       → Skills, Hooks, Permissions, Agents, Keybindings
Analytics    → Usage, Costs, Conversations, Sessions
Content      → CLAUDE.md, Memories, Plans, Prompts, Commands
System       → Health, Storage, Backups, Plugins, Debug, Changes
Inspect      → Paste History, Privacy Audit, Feature Flags
```

## How It Works

A lightweight Node.js HTTP server that:
1. **Reads** your `~/.claude/` config files directly
2. **Serves** 26 web pages on `localhost:3456`
3. **Writes** changes back with automatic backups
4. **Proxies** npm registry (marketplace) and frankfurter.app (currency)

### Files It Reads/Writes

| File | Purpose |
|------|---------|
| `~/.claude.json` | MCP server configurations |
| `~/.claude/settings.json` | Skills, hooks, plugins |
| `~/.claude/settings.local.json` | Permissions, local overrides |
| `~/.claude/keybindings.json` | Keyboard shortcuts |
| `~/.claude/stats-cache.json` | Usage statistics |
| `~/.claude/history.jsonl` | Prompt history |
| `~/.claude/.credentials.json` | Auth status (read-only) |
| `~/.claude/skills/*.md` | Custom skills |
| `~/.claude/plans/*.md` | Saved plans |
| `~/.claude/projects/*/` | Conversations, memories |
| `~/.claude/debug/*.txt` | Debug logs |
| `~/.claude/file-history/` | File revision snapshots |
| `~/.claude/paste-cache/` | Pasted content |
| `~/.claude/telemetry/` | Failed telemetry events |
| `~/.claude/statsig/` | Feature flags |
| `~/.claude/shell-snapshots/` | Shell environment snapshots |

## Configuration

```javascript
const PORT = 3456; // Change in mcp-manager-server.js
```

## Auto-Start on Boot (Windows)

An `autostart.vbs` file is included:

1. Press `Win+R`, type `shell:startup`, press Enter
2. Copy `autostart.vbs` into the Startup folder
3. Auto-detects your username — no editing needed

**To stop:** Task Manager > End `node.exe`

## Documentation

Detailed docs for each page: [`docs/`](docs/)

## Architecture

```
claude-code-dashboard/
  mcp-manager-server.js      # Server (all routes + 40+ API endpoints)
  dashboard-nav.js            # Grouped dropdown navigation
  autostart.vbs               # Windows auto-start
  test-dashboard.js           # 102 automated tests
  package.json                # npm config
  LICENSE                     # MIT
  README.md                   # This file
  docs/                       # 26 page documentation files
  *.html                      # 26 page files
```

**No build step. No bundler. No framework. Just HTML + vanilla JS + one Node.js server.**

## API Reference

<details>
<summary>40+ API endpoints (click to expand)</summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/config` | Read .claude.json |
| POST | `/api/config` | Write .claude.json |
| GET | `/api/settings-local` | Read settings.local.json |
| POST | `/api/settings-local` | Write settings.local.json |
| GET | `/api/hooks` | Read hooks |
| POST | `/api/hooks` | Write hooks |
| GET | `/api/skills` | List skills |
| POST | `/api/skills/save` | Create/update skill |
| POST | `/api/skills/delete` | Delete skill |
| GET | `/api/memories` | List memories |
| POST | `/api/memories/save` | Save memory |
| POST | `/api/memories/delete` | Delete memory |
| GET | `/api/tools?name=X` | Fetch tools from MCP server |
| GET | `/api/tools/ping?name=X` | Ping MCP server |
| GET | `/api/usage/stats` | Usage statistics |
| GET | `/api/usage/history` | Prompt history |
| GET | `/api/conversations` | List conversations (with topics) |
| GET | `/api/conversations/session` | Read conversation |
| POST | `/api/conversations/delete` | Delete conversation |
| GET | `/api/conversations/export` | Export as markdown |
| GET | `/api/sessions` | Browse sessions (with topics) |
| GET | `/api/plans` | Plans and todos |
| GET | `/api/docs` | Find CLAUDE.md files |
| POST | `/api/docs/save` | Save CLAUDE.md |
| GET | `/api/backups` | List backups |
| POST | `/api/backups/content` | View backup content |
| POST | `/api/backups/restore` | Restore backup |
| GET | `/api/keybindings` | Read keybindings |
| POST | `/api/keybindings` | Write keybindings |
| GET | `/api/plugins` | List plugins |
| GET | `/api/storage` | Disk usage |
| GET | `/api/health` | Health checks + account info |
| GET | `/api/health/doctor` | Config validation |
| GET | `/api/export` | Export all configs |
| GET | `/api/file-history` | File change groups |
| GET | `/api/file-history/content` | File version content |
| POST | `/api/file-history/save-as` | Rollback/save file |
| GET | `/api/debug` | List debug logs |
| GET | `/api/debug/content` | Read debug log |
| GET | `/api/debug/common-errors` | Error pattern analysis |
| GET | `/api/currency?from=USD&to=INR` | Currency conversion |
| GET | `/api/npm/search` | Search npm registry |
| GET | `/api/npm/package` | npm package details |
| POST | `/api/marketplace/install` | Install MCP server |
| POST | `/api/marketplace/uninstall` | Uninstall MCP server |
| GET | `/api/paste-history` | Paste cache + history |
| GET | `/api/shell-snapshots` | Shell environment snapshots |
| GET | `/api/mcp-auth` | MCP auth status |
| GET | `/api/feature-flags` | Statsig feature flags |
| GET | `/api/telemetry` | Telemetry audit |
| GET | `/api/common-prompts` | Auto-discovered prompts |

</details>

## Contributing

PRs welcome! Areas to contribute:

- [ ] Light/dark theme toggle
- [ ] Cost estimation for OpenRouter / Bedrock / Vertex models
- [ ] Session conversation search across ALL sessions
- [ ] MCP server health monitoring alerts (email/Slack)
- [ ] Diff viewer for backup comparison
- [ ] Docker container
- [ ] Electron desktop app
- [ ] Real-time WebSocket updates
- [ ] Multi-user support

## License

MIT
