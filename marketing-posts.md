# Claude Code Dashboard — Marketing Posts

---

## LINKEDIN POST

**I built a dashboard for myself to manage Claude Code. Then I thought — why not share it?**

I use Claude Code every day. And every day I was doing the same annoying things:

- Opening `.claude.json` to add/remove MCP servers
- Guessing how many tokens I burned this week
- Forgetting which hooks I configured where
- Digging through terminal output to find what happened in a session

So I built a simple dashboard. Just for me. Plain HTML + Node.js — nothing fancy. It just needed to work.

Then I realized every Claude Code user probably has the same pain. Reddit is full of it:
- "Took me 30 minutes to figure out where the MCP config lives"
- "$4,800 in tokens this month with zero visibility"
- "3 months later and configuring MCP is still a PITA"

So I wrapped it in Electron to make it a proper desktop app, vibe-coded the whole thing using Claude Code itself, and open-sourced it.

**What it does:**
- MCP Server Manager — add, remove, toggle servers visually
- Cost & Usage Tracking — see your actual token spend
- Hooks & Permissions Editor — no more JSON surgery
- Session Explorer — browse your conversation history
- Memory & CLAUDE.md Manager — all your project context in one place
- Embedded Terminal — run Claude Code right inside the dashboard
- Health Monitor — see what's working, what's broken

The tech stack is intentionally simple: HTML, CSS, JS, Node.js. No React, no build tools, no dependency hell. I wanted anyone to be able to read the code and contribute.

It's **free, open source, and works on Windows, Mac, and Linux.**

If you use Claude Code and want a visual layer on top of it:
https://github.com/harshit-coder/claude-code-dashboard/releases

Stars, forks, PRs — all welcome. I'm actively looking for contributors, especially for:
- Tauri migration (shrink the 150MB exe to ~10MB)
- Better cost analytics
- Cross-platform testing

Built for myself. Shared for everyone.

#ClaudeCode #OpenSource #VibeCoding #DeveloperTools #AI #Anthropic #BuildInPublic

---

## TWITTER/X POST (Thread)

**Tweet 1:**
I kept editing .claude.json by hand every day just to manage MCP servers.

Got tired of it. Built a simple HTML + Node.js dashboard for myself.

Then I thought — every Claude Code user has this problem.

So I open-sourced it.

https://github.com/harshit-coder/claude-code-dashboard/releases

🧵

**Tweet 2:**
Started simple — just wanted to stop guessing my token spend and stop hand-editing JSON configs.

Plain HTML + Node.js. No frameworks. Just needed it to work.

Then I wrapped it in Electron to make it a desktop app anyone can install.

**Tweet 3:**
What it solves (all things I was doing manually):

- MCP server config → visual manager
- Token costs → usage dashboard
- Hooks/permissions → GUI editor
- Session history → explorer view
- CLAUDE.md files → built-in editor
- Health checks → monitor page

**Tweet 4:**
The whole thing was vibe-coded with Claude Code.

Tech stack is dead simple on purpose: HTML, CSS, JS, Node.js. No React, no build step.

If you can read HTML, you can contribute.

**Tweet 5:**
Reddit is full of these pain points:

"took me 30 min to find where the config lives"
"$4,800 in tokens with zero tracking"
"configuring MCP is still a PITA after 3 months"

This dashboard exists because I had the same problems.

**Tweet 6:**
It's free. Open source. MIT license.

Looking for contributors:
- Tauri migration (smaller binary)
- Better analytics
- Linux/Mac testing

Built for myself. Shared for everyone.

Fork it → https://github.com/harshit-coder/claude-code-dashboard

#ClaudeCode #OpenSource #VibeCoding

---

## REDDIT POST (r/ClaudeAI)

**Title:** Built a dashboard for myself to manage Claude Code daily chaos — MCP servers, costs, hooks, sessions. Open-sourced it. Looking for contributors.

**Body:**

I use Claude Code as my daily driver. And every day I was doing the same repetitive stuff:

- Hand-editing `.claude.json` to toggle MCP servers
- Having zero idea how many tokens I was burning
- Forgetting where I put which hook or permission rule
- Scrolling through terminal output trying to find what happened 3 sessions ago

So I built a dashboard. Just for me. Simple HTML + Node.js backend — nothing fancy, just needed to solve my own problems.

Then I kept seeing the same frustrations here on Reddit:

> "took me 30 minutes to figure out where the config lives"

> "$4,800 worth of Claude tokens this month with zero visibility"

> "3 months later and it's still a PITA"

And I thought — if I'm building this anyway, why not make it a proper app and share it?

So I wrapped it in Electron (needed something cross-platform for desktop), vibe-coded the entire thing using Claude Code itself, and put it on GitHub.

### What's in it:

| Feature | What I was doing before |
|---------|------------------------|
| MCP Server Manager | Editing `.claude.json` in vim |
| Cost & Usage Tracker | Guessing and hoping |
| Hooks Editor | Copy-pasting JSON snippets |
| Permissions Manager | Editing `settings.local.json` |
| Session Explorer | Scrolling terminal history |
| Memory Manager | Navigating `.claude/projects/` manually |
| CLAUDE.md Editor | Opening in a separate editor |
| Health Monitor | Running random diagnostic commands |
| Embedded Terminal | Alt-tabbing between windows |
| Model Switcher | Remembering CLI flags |

### Why the tech stack is so simple:

I deliberately used **plain HTML + CSS + JS** with a **Node.js** HTTP server. No React, no Next.js, no build step. Two reasons:

1. I wanted it to just work — no dependency hell
2. Anyone should be able to read the code and contribute. If you know HTML, you can add a page.

Electron is just the desktop wrapper. I'm planning a **Tauri migration** to bring the exe from ~150MB down to ~10MB.

### Looking for contributors:

- **Tauri migration** — if you know Rust, this would be huge
- **Cost analytics** — CSV export, multi-project comparison, alerts
- **Linux/Mac testing** — I develop on Windows
- **New dashboard pages** — the architecture makes it easy to add features

**100% free. Open source. MIT license.**

Download: https://github.com/harshit-coder/claude-code-dashboard/releases
Repo: https://github.com/harshit-coder/claude-code-dashboard

The irony: Claude Code built its own management dashboard. The vibe coding circle is complete.

If you've got feature requests or want to contribute, drop a comment or open an issue. Building this in the open.

---

## REDDIT POST (r/programming or r/SideProject)

**Title:** I was tired of editing JSON files to configure my AI coding tool, so I built a desktop dashboard. Vibe-coded the whole thing with AI. Open source.

**Body:**

I use Claude Code (Anthropic's CLI coding agent) daily. The tool itself is great, but managing it is all JSON configs and terminal commands.

Every day I was:
- Hand-editing config files to manage MCP servers
- Guessing my token usage
- Configuring hooks and permissions in raw JSON
- Scrolling through terminal output to review sessions

I built a simple HTML + Node.js dashboard to solve these problems for myself. Then I thought others might want it too, so I wrapped it in Electron and open-sourced it.

**Tech stack is deliberately minimal:**
- Vanilla HTML/CSS/JS frontend (~15 pages)
- Node.js HTTP backend (~2400 lines)
- Electron for desktop packaging
- No React, no build tools, no frameworks

The entire thing was vibe-coded using Claude Code. An AI tool that built its own management dashboard.

**Looking for contributors:**
- Tauri migration (Rust — shrink exe from 150MB to 10MB)
- Cross-platform testing
- New feature pages (the architecture makes it trivial)

Simple codebase by design. If you can write HTML, you can contribute.

Repo: https://github.com/harshit-coder/claude-code-dashboard
Download: https://github.com/harshit-coder/claude-code-dashboard/releases

MIT license. Built for myself, shared for everyone.
