# Cost Calculator

## Overview

The Cost Calculator page (`/costs`) provides token cost estimation with live currency conversion. It analyzes your Claude Code usage to show per-model cost breakdowns, burn rates, and usage trends so you can monitor and manage your spending.

## Features

### Per-Model Cost Breakdown
Costs are calculated separately for each model (Opus, Sonnet, Haiku, etc.) based on their respective token pricing. A summary table shows input, output, cache read, and cache write costs for each model.

### Live Exchange Rates
Currency conversion is powered by the frankfurter.app API (proxied through the dashboard backend). Select your local currency and all costs update in real time. Supports 30+ currencies including USD, EUR, GBP, INR, JPY, and more.

### Editable Pricing
Override default per-token prices for any model. Custom pricing is stored in localStorage so your adjustments persist across sessions. A reset button restores official Anthropic pricing.

### Burn Rate Card
Displays your current daily, weekly, and monthly burn rate extrapolated from recent usage. Highlights whether you are trending above or below your historical average.

### Rate Limit Predictor
Estimates when you will hit API rate limits based on your current usage velocity. Shows remaining capacity for tokens-per-minute and requests-per-minute limits.

### Usage Window Trackers
Two dedicated trackers show your cumulative usage within rolling windows:
- **5-Hour Window**: Tracks usage in the current 5-hour block, relevant to Anthropic's shorter rate limit windows.
- **Weekly Window**: Shows your total consumption for the current 7-day period.

### Daily Cost Chart
A bar chart visualizes your daily spending over the past 30 days. Hover over bars to see exact amounts. Color-coded by model to show which models drive the most cost.

## API Endpoints

### GET /api/usage/stats
Returns aggregated usage statistics including token counts by model, session counts, and time-series data. Supports query parameters:
- `days` -- Number of days to include (default: 30).
- `project` -- Filter to a specific project.

### GET /api/currency
Proxies exchange rate requests to frankfurter.app. Query parameters:
- `from` -- Base currency code (default: USD).
- `to` -- Target currency code.

Returns the current exchange rate and last-updated timestamp.

## How It Works

1. The backend scans Claude Code history files and extracts `usage` objects from each assistant message. These contain `input_tokens`, `output_tokens`, `cache_creation_input_tokens`, and `cache_read_input_tokens`.
2. Token counts are grouped by model and date, then multiplied by the applicable per-token price to produce cost estimates.
3. The frontend fetches these aggregated stats and applies currency conversion client-side using the exchange rate from the currency endpoint.
4. Custom pricing overrides (stored in localStorage) replace default rates before the cost calculation runs.
5. Burn rate is computed as a weighted moving average of the last 7 days of spending, projected forward.
6. Rate limit predictions use your tokens-per-minute average over the last hour compared to known Anthropic tier limits.

## Troubleshooting

### Costs show $0.00
- Ensure there are recent sessions with usage data in the history files.
- Check that the backend can read `~/.claude/projects/` directories.
- Older Claude Code versions may not embed usage data in history events.

### Currency conversion fails
- The frankfurter.app API may be temporarily unavailable. Costs will display in USD as a fallback.
- Check your network connection and any proxy/firewall settings.

### Pricing seems wrong
- Verify your custom pricing overrides in localStorage. Click the reset button to restore defaults.
- Anthropic may have updated pricing; the dashboard ships with pricing as of its release date.

### Burn rate is unexpectedly high
- Burn rate includes all models. Heavy use of expensive models (Opus) will drive up the average.
- The predictor uses recent data; a single heavy-usage day can skew the projection.

### Chart does not render
- Ensure JavaScript is enabled and no ad blockers are interfering with the chart library.
- Try a hard refresh (Ctrl+Shift+R) to clear cached assets.

### Rate limit predictor shows "N/A"
- Insufficient recent data to compute a meaningful prediction. Use Claude Code for a few sessions and revisit.
- Rate limits vary by API tier; the predictor uses default tier limits unless configured otherwise.
