# Feature Flags

## Overview

The Feature Flags page (`/flags`) displays the Statsig feature flags and experiments that are active in your Claude Code installation. It helps you understand which features are enabled, what A/B tests you are enrolled in, and how these flags affect Claude Code's behavior.

## Features

### Expandable JSON Viewer
Each feature flag is displayed as a collapsible card. Click to expand and see the full JSON configuration including:
- Flag name and status (enabled/disabled)
- Rule ID and evaluation details
- Default values and overrides
- Experiment group assignment (if applicable)
- Associated metadata and conditions

The JSON is rendered with syntax highlighting for readability: strings in green, numbers in blue, booleans in orange, and keys in bold.

### Search
A search bar filters flags by name or value. Type any part of a flag name, value, or metadata field to narrow the list. Results update in real time as you type.

### A/B Testing Information
An informational section explains how Anthropic uses feature flags and experiments in Claude Code:
- What Statsig is and how it manages feature rollouts
- How A/B test groups are assigned (typically by installation ID)
- What types of features are commonly gated behind flags
- How flag values are cached locally and refreshed
- The distinction between feature gates (boolean on/off) and dynamic configs (structured values)

## API Endpoints

### GET /api/feature-flags
Returns all cached Statsig feature flags and experiments. Response structure:

```json
{
  "flags": [
    {
      "name": "flag_name",
      "enabled": true,
      "value": { ... },
      "ruleID": "rule_123",
      "source": "statsig"
    }
  ],
  "experiments": [
    {
      "name": "experiment_name",
      "group": "test",
      "value": { ... },
      "ruleID": "rule_456"
    }
  ],
  "lastSynced": "2025-12-01T10:00:00Z"
}
```

No query parameters. Returns all cached flags and experiments.

## How It Works

1. Claude Code uses Statsig for feature flag management. When Claude Code starts, it fetches flag configurations from the Statsig service and caches them locally in `~/.claude/statsig/`.

2. The cached flag data is stored as JSON files. The dashboard backend reads these files and returns the parsed flag configurations through the API.

3. The frontend renders each flag as a collapsible card. Flags are sorted alphabetically by name. Enabled flags are visually distinguished from disabled ones with a colored status indicator.

4. The search function filters flags client-side by matching the search query against the serialized JSON representation of each flag, so you can search by any field value.

5. Flag data is read-only. The dashboard does not modify flag values or interact with the Statsig service. It only displays the locally cached state.

6. The `lastSynced` timestamp indicates when Claude Code last refreshed its flag cache from the Statsig backend. Stale caches may show outdated flag states.

## Troubleshooting

### No flags appear
- Claude Code must have been run at least once to initialize the Statsig cache.
- Check that `~/.claude/statsig/` exists and contains cache files.
- The backend must have read access to the Statsig cache directory.

### Flags seem outdated
- The dashboard shows the locally cached state. Claude Code refreshes this cache periodically when it starts.
- Run a Claude Code session to trigger a cache refresh, then reload the flags page.

### Search does not match expected flags
- Search matches against the full JSON representation. Try searching for the exact flag name or a specific value.
- Flag names may use underscores or camelCase; try both conventions.

### JSON viewer shows raw text instead of highlighted JSON
- Ensure JavaScript is enabled in your browser. Syntax highlighting is applied client-side.
- Try a hard refresh (Ctrl+Shift+R) to reload the page assets.

### "lastSynced" shows a very old date
- Claude Code may not have connected to Statsig recently. This happens in offline or air-gapped environments.
- The flags will still function based on cached values, but may not reflect recent changes from Anthropic.

### Flag values differ from expected behavior
- Some flags have complex evaluation rules that depend on user attributes, environment, or random group assignment.
- The displayed value is the evaluated result for your specific installation. Other users may see different values.

### Cannot modify flags
- The dashboard is read-only for feature flags. Flag values are controlled by Anthropic through the Statsig service.
- Local overrides are not supported through the dashboard. Advanced users can modify the cache files directly, but this is not recommended as changes will be overwritten on the next sync.
