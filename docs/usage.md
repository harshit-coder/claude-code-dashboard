# Usage Page (`/usage`)

## Overview

The Usage page is an activity analytics dashboard that visualizes your Claude Code usage patterns. It draws data from local cache and history files to present summary statistics, charts, and detailed breakdowns of your interactions with Claude.

## Features

- **Summary cards** showing key metrics at a glance
- **Daily activity bar chart** with configurable time ranges
- **Model usage table** with per-model token counts
- **Activity by hour** chart showing usage distribution across the day
- **Daily tokens by model** stacked bar chart
- **GitHub-style contribution heatmap** for long-term trends
- **Prompt history** with full-text search
- **Project breakdown** showing usage per project

## How It Works

### Data Sources

The dashboard reads from two local files:

| File | Purpose |
|------|---------|
| `~/.claude/stats-cache.json` | Aggregated usage statistics (tokens, sessions, tool calls) |
| `~/.claude/history.jsonl` | Line-delimited JSON log of every prompt and response |

The stats cache is updated by Claude Code after each session. The history file is appended to in real time during conversations.

### Summary Cards

| Card | Description |
|------|-------------|
| Total Messages | Count of all user + assistant messages |
| Sessions | Number of distinct conversation sessions |
| Tool Calls | Total tool invocations across all sessions |
| Output Tokens | Sum of all output tokens consumed |
| Longest Session | Duration of the longest single session |

### Daily Activity Chart

A bar chart showing message count per day. Supports time range filters:

- **7d** - Last 7 days
- **14d** - Last 14 days
- **30d** - Last 30 days
- **All** - Entire history

### Model Usage Table

Displays a breakdown of token usage per model (e.g., `claude-sonnet-4-20250514`, `claude-opus-4-6`), showing input tokens, output tokens, and total tokens for each.

### Activity by Hour

A bar chart showing which hours of the day you use Claude most frequently, based on message timestamps in local time.

### Daily Tokens by Model

A stacked bar chart where each bar represents a day and segments represent different models, colored distinctly.

### GitHub-Style Heatmap

A calendar heatmap showing activity intensity over the past year, similar to GitHub's contribution graph. Darker cells indicate more activity.

### Prompt History

A searchable table of past prompts with timestamps, allowing you to find specific conversations. Supports full-text filtering.

### Project Breakdown

Shows per-project statistics including message counts, token usage, and session counts.

## API Endpoints

### `GET /api/usage/stats`

Returns aggregated usage statistics from the stats cache.

**Response:**

```json
{
  "totalMessages": 12450,
  "totalSessions": 342,
  "totalToolCalls": 8901,
  "totalOutputTokens": 5200000,
  "longestSession": "2h 14m",
  "daily": [{ "date": "2026-03-22", "messages": 45, "tokens": 32000 }],
  "byModel": [{ "model": "claude-sonnet-4-20250514", "inputTokens": 1000000, "outputTokens": 500000 }],
  "byHour": [{ "hour": 14, "count": 230 }]
}
```

### `GET /api/usage/history`

Returns prompt history from the history JSONL file.

**Response:**

```json
{
  "prompts": [
    {
      "timestamp": "2026-03-22T10:30:00Z",
      "prompt": "Create a new React component...",
      "project": "my-app",
      "model": "claude-sonnet-4-20250514"
    }
  ]
}
```

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| Stats file | `~/.claude/stats-cache.json` | Path to the aggregated stats cache |
| History file | `~/.claude/history.jsonl` | Path to the prompt history log |
| Default range | `30d` | Default time range for daily activity chart |

## Troubleshooting

- **No data displayed:** Ensure `~/.claude/stats-cache.json` exists. Run a Claude Code session to generate it.
- **History search slow:** Large `history.jsonl` files (100MB+) may cause delays. The API paginates results.
- **Heatmap gaps:** Days with zero activity appear as empty cells, which is expected behavior.
- **Token counts seem low:** Stats only include local CLI usage, not web or API usage.
- **Charts not rendering:** Check browser console for JavaScript errors; ensure the page fully loaded.
