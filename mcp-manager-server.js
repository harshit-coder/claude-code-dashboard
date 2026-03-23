#!/usr/bin/env node
// =============================================================================
// Claude Code Dashboard — Backend Server
// =============================================================================
//
// PURPOSE:
//   Local Node.js server that serves the MCP Manager UI (mcp-manager.html)
//   and provides API endpoints to read/write .claude.json.
//   This allows the browser to auto-load the config without manual file picking.
//
// HOW TO RUN:
//   node mcp-manager-server.js
//   Then open http://localhost:3456 in your browser.
//
// AUTO-START ON BOOT:
//   The file mcp-manager-start.vbs (in Windows Startup folder) launches this
//   server silently on every login. To stop: Task Manager -> End "node.exe".
//   To remove auto-start: delete mcp-manager-start.vbs from shell:startup.
//
// IF .claude.json PATH CHANGES:
//   Update CLAUDE_JSON_PATH below to the new path. That's the only change needed.
//   The HTML reads the path from the server automatically.
//
// API ENDPOINTS:
//   GET  /            — Serves the HTML UI
//   GET  /api/config  — Returns .claude.json contents as JSON
//   POST /api/config  — Writes new data to .claude.json (creates .backup first)
//
// FILES:
//   mcp-manager-server.js  — This file (Node.js server)
//   mcp-manager.html       — The UI (served by this server)
//   mcp-manager-start.vbs  — Silent launcher for Windows Startup
// =============================================================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// ========== CONFIG (change this if your .claude.json moves) ==========
const CLAUDE_JSON_PATH = path.join(process.env.USERPROFILE || process.env.HOME, '.claude.json');
const CLAUDE_PROJECTS_DIR = path.join(process.env.USERPROFILE || process.env.HOME, '.claude', 'projects');
const SETTINGS_LOCAL_PATH = path.join(process.env.USERPROFILE || process.env.HOME, '.claude', 'settings.local.json');
const PORT = 3456;
// =====================================================================

const HOME = process.env.USERPROFILE || process.env.HOME;
const CLAUDE_DIR = path.join(HOME, '.claude');

// HTML pages
const PAGES = {
  '/':            path.join(__dirname, 'homepage.html'),
  '/servers':     path.join(__dirname, 'mcp-manager.html'),
  '/memory':      path.join(__dirname, 'memory-manager.html'),
  '/tools':       path.join(__dirname, 'tools-manager.html'),
  '/skills':      path.join(__dirname, 'skills-manager.html'),
  '/hooks':       path.join(__dirname, 'hooks-manager.html'),
  '/usage':       path.join(__dirname, 'usage-manager.html'),
  '/permissions': path.join(__dirname, 'permissions-manager.html'),
  '/plans':       path.join(__dirname, 'plans-manager.html'),
  '/docs':        path.join(__dirname, 'docs-manager.html'),
  '/backups':     path.join(__dirname, 'backups-manager.html'),
  '/keybindings': path.join(__dirname, 'keybindings-manager.html'),
  '/agents':      path.join(__dirname, 'agents-manager.html'),
  '/plugins':     path.join(__dirname, 'plugins-manager.html'),
  '/sessions':    path.join(__dirname, 'sessions-manager.html'),
  '/storage':     path.join(__dirname, 'storage-manager.html'),
  '/health':      path.join(__dirname, 'health-manager.html'),
  '/marketplace':   path.join(__dirname, 'marketplace.html'),
  '/conversations': path.join(__dirname, 'conversations-manager.html'),
  '/costs':         path.join(__dirname, 'costs-manager.html'),
  '/changes':       path.join(__dirname, 'changes-manager.html'),
  '/debug':         path.join(__dirname, 'debug-manager.html'),
  '/commands':      path.join(__dirname, 'commands-manager.html'),
  '/prompts':       path.join(__dirname, 'prompts-manager.html'),
  '/pastes':        path.join(__dirname, 'pastes-manager.html'),
  '/privacy':       path.join(__dirname, 'privacy-manager.html'),
  '/flags':         path.join(__dirname, 'flags-manager.html'),
  '/models':        path.join(__dirname, 'models-manager.html'),
  '/help':          path.join(__dirname, 'help-page.html'),
  // Desktop app pages
  '/terminal':      path.join(__dirname, 'terminal', 'terminal.html'),
  '/multi-console': path.join(__dirname, 'terminal', 'multi-console.html'),
  '/agent-runner':  path.join(__dirname, 'agent-runner.html'),
};

// Data paths
const SETTINGS_JSON_PATH = path.join(CLAUDE_DIR, 'settings.json');
const STATS_CACHE_PATH = path.join(CLAUDE_DIR, 'stats-cache.json');
const HISTORY_PATH = path.join(CLAUDE_DIR, 'history.jsonl');
const SESSIONS_DIR = path.join(CLAUDE_DIR, 'sessions');
const SKILLS_DIR = path.join(CLAUDE_DIR, 'skills');
const PLANS_DIR = path.join(CLAUDE_DIR, 'plans');
const TODOS_DIR = path.join(CLAUDE_DIR, 'todos');
const BACKUPS_DIR = path.join(CLAUDE_DIR, 'backups');
const FILE_HISTORY_DIR = path.join(CLAUDE_DIR, 'file-history');
const PLUGINS_DIR = path.join(CLAUDE_DIR, 'plugins');
const KEYBINDINGS_PATH = path.join(CLAUDE_DIR, 'keybindings.json');
const CREDENTIALS_PATH = path.join(CLAUDE_DIR, '.credentials.json');

const server = http.createServer((req, res) => {
  // CORS headers for local dev
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Serve shared nav.js
  if (req.url === '/nav.js' || req.url === '/dashboard-nav.js') {
    fs.readFile(path.join(__dirname, 'dashboard-nav.js'), (err, data) => {
      if (err) { res.writeHead(404); res.end('Not found'); return; }
      res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
      res.end(data);
    });
    return;
  }

  // Serve vendor assets (xterm.js, codemirror, etc.)
  if (req.url.startsWith('/vendor/')) {
    const vendorFile = path.join(__dirname, req.url);
    const ext = path.extname(vendorFile);
    const mimeTypes = { '.js': 'application/javascript', '.css': 'text/css', '.map': 'application/json' };
    fs.readFile(vendorFile, (err, data) => {
      if (err) { res.writeHead(404); res.end('Not found'); return; }
      res.writeHead(200, { 'Content-Type': (mimeTypes[ext] || 'application/octet-stream') + '; charset=utf-8' });
      res.end(data);
    });
    return;
  }

  // Serve terminal CSS
  if (req.url.startsWith('/terminal/') && req.url.endsWith('.css')) {
    const cssFile = path.join(__dirname, req.url);
    fs.readFile(cssFile, (err, data) => {
      if (err) { res.writeHead(404); res.end('Not found'); return; }
      res.writeHead(200, { 'Content-Type': 'text/css; charset=utf-8' });
      res.end(data);
    });
    return;
  }

  // Dynamic page router — strip query params for matching
  const urlPath = req.url.split('?')[0];
  const pagePath = urlPath === '/index.html' ? '/' : urlPath;
  if (PAGES[pagePath]) {
    fs.readFile(PAGES[pagePath], (err, data) => {
      if (err) { res.writeHead(500); res.end('Error loading page: ' + pagePath); return; }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });
    return;
  }

  // API: Read .claude.json
  if (req.url === '/api/config' && req.method === 'GET') {
    fs.readFile(CLAUDE_JSON_PATH, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Cannot read: ' + err.message, path: CLAUDE_JSON_PATH }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ data: JSON.parse(data), path: CLAUDE_JSON_PATH }));
    });
    return;
  }

  // API: Write .claude.json
  if (req.url === '/api/config' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        // Validate it's valid JSON before writing
        const parsed = JSON.parse(body);
        const pretty = JSON.stringify(parsed, null, 2);

        // Backup before writing
        const backupPath = CLAUDE_JSON_PATH + '.backup';
        try { fs.copyFileSync(CLAUDE_JSON_PATH, backupPath); } catch (_) {}

        fs.writeFile(CLAUDE_JSON_PATH, pretty, 'utf8', (err) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Write failed: ' + err.message }));
            return;
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, path: CLAUDE_JSON_PATH }));
        });
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON: ' + e.message }));
      }
    });
    return;
  }

  // ==================== MEMORY APIs ====================

  // API: List all Claude memory projects and their memory files
  // GET /api/memories
  if (req.url === '/api/memories' && req.method === 'GET') {
    try {
      const projects = fs.readdirSync(CLAUDE_PROJECTS_DIR);
      const result = [];

      for (const proj of projects) {
        const memDir = path.join(CLAUDE_PROJECTS_DIR, proj, 'memory');
        if (!fs.existsSync(memDir)) continue;

        const files = fs.readdirSync(memDir).filter(f => f.endsWith('.md'));
        const memories = [];

        for (const file of files) {
          const filePath = path.join(memDir, file);
          const content = fs.readFileSync(filePath, 'utf8');

          // Parse frontmatter
          let name = file.replace('.md', '');
          let description = '';
          let type = '';
          let body = content;

          const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
          if (fmMatch) {
            const fm = fmMatch[1];
            body = fmMatch[2];
            const nameMatch = fm.match(/^name:\s*(.+)$/m);
            const descMatch = fm.match(/^description:\s*(.+)$/m);
            const typeMatch = fm.match(/^type:\s*(.+)$/m);
            if (nameMatch) name = nameMatch[1].trim();
            if (descMatch) description = descMatch[1].trim();
            if (typeMatch) type = typeMatch[1].trim();
          }

          memories.push({
            file,
            filePath: filePath.replace(/\\/g, '/'),
            name,
            description,
            type,
            body: body.trim(),
            fullContent: content,
            isIndex: file === 'MEMORY.md'
          });
        }

        if (memories.length > 0) {
          // Decode project path: C--Users-username becomes C:/Users/username
          const decoded = proj.replace(/^([A-Za-z])--/, '$1:/').replace(/-/g, '/');
          result.push({ project: proj, projectPath: decoded, memories });
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // API: Save a memory file
  // POST /api/memories/save  { filePath, content }
  if (req.url === '/api/memories/save' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { filePath: fp, content } = JSON.parse(body);
        if (!fp || !fp.includes('.claude')) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid path' }));
          return;
        }
        const normalizedPath = fp.replace(/\//g, path.sep);
        fs.writeFileSync(normalizedPath, content, 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // API: Delete a memory file
  // POST /api/memories/delete  { filePath }
  if (req.url === '/api/memories/delete' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { filePath: fp } = JSON.parse(body);
        if (!fp || !fp.includes('.claude') || fp.endsWith('MEMORY.md')) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Cannot delete this file' }));
          return;
        }
        const normalizedPath = fp.replace(/\//g, path.sep);
        if (fs.existsSync(normalizedPath)) fs.unlinkSync(normalizedPath);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // API: Proxy for Mem0 API
  // GET /api/mem0?endpoint=...
  if (req.url.startsWith('/api/mem0') && req.method === 'GET') {
    const urlObj = new URL(req.url, `http://localhost:${PORT}`);
    const endpoint = urlObj.searchParams.get('endpoint') || '/v1/memories/';
    const userId = urlObj.searchParams.get('user_id') || 'default';

    // Read mem0 API key from .claude.json
    let apiKey = '';
    try {
      const raw = fs.readFileSync(CLAUDE_JSON_PATH, 'utf8');
      const data = JSON.parse(raw);
      apiKey = data.mcpServers?.mem0?.env?.MEM0_API_KEY || '';
    } catch (_) {}

    if (!apiKey) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'MEM0_API_KEY not found in .claude.json' }));
      return;
    }

    const https = require('https');
    const options = {
      hostname: 'api.mem0.ai',
      path: `${endpoint}?user_id=${encodeURIComponent(userId)}`,
      method: 'GET',
      headers: { 'Authorization': `Token ${apiKey}`, 'Content-Type': 'application/json' }
    };

    const apiReq = https.request(options, (apiRes) => {
      let data = '';
      apiRes.on('data', chunk => data += chunk);
      apiRes.on('end', () => {
        res.writeHead(apiRes.statusCode, { 'Content-Type': 'application/json' });
        res.end(data);
      });
    });
    apiReq.on('error', (e) => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    });
    apiReq.end();
    return;
  }

  // API: Delete Mem0 memory
  // POST /api/mem0/delete  { memoryId }
  if (req.url === '/api/mem0/delete' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const { memoryId } = JSON.parse(body);
      let apiKey = '';
      try {
        const raw = fs.readFileSync(CLAUDE_JSON_PATH, 'utf8');
        const data = JSON.parse(raw);
        apiKey = data.mcpServers?.mem0?.env?.MEM0_API_KEY || '';
      } catch (_) {}

      const https = require('https');
      const options = {
        hostname: 'api.mem0.ai',
        path: `/v1/memories/${memoryId}/`,
        method: 'DELETE',
        headers: { 'Authorization': `Token ${apiKey}` }
      };
      const apiReq = https.request(options, (apiRes) => {
        let data = '';
        apiRes.on('data', chunk => data += chunk);
        apiRes.on('end', () => {
          res.writeHead(apiRes.statusCode, { 'Content-Type': 'application/json' });
          res.end(data || '{"success":true}');
        });
      });
      apiReq.on('error', (e) => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      });
      apiReq.end();
    });
    return;
  }

  // ==================== USAGE API ====================

  // API: Get daily stats
  // GET /api/usage/stats
  if (req.url === '/api/usage/stats' && req.method === 'GET') {
    fs.readFile(STATS_CACHE_PATH, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ dailyActivity: [] }));
        return;
      }
      try {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(data);
      } catch (e) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ dailyActivity: [] }));
      }
    });
    return;
  }

  // API: Get history (prompts)
  // GET /api/usage/history?limit=100&offset=0
  if (req.url.startsWith('/api/usage/history') && req.method === 'GET') {
    const urlObj = new URL(req.url, `http://localhost:${PORT}`);
    const limit = parseInt(urlObj.searchParams.get('limit')) || 200;

    fs.readFile(HISTORY_PATH, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ history: [], total: 0 }));
        return;
      }
      const lines = data.trim().split('\n').filter(l => l.trim());
      const total = lines.length;
      // Return most recent entries
      const recent = lines.slice(-limit).reverse();
      const parsed = [];
      for (const line of recent) {
        try { parsed.push(JSON.parse(line)); } catch (_) {}
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ history: parsed, total }));
    });
    return;
  }

  // API: Get sessions
  // GET /api/usage/sessions
  if (req.url === '/api/usage/sessions' && req.method === 'GET') {
    try {
      const files = fs.readdirSync(SESSIONS_DIR).filter(f => f.endsWith('.json'));
      const sessions = [];
      for (const f of files) {
        try {
          const raw = fs.readFileSync(path.join(SESSIONS_DIR, f), 'utf8');
          const data = JSON.parse(raw);
          sessions.push(data);
        } catch (_) {}
      }
      sessions.sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ sessions, count: sessions.length }));
    } catch (e) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ sessions: [], count: 0 }));
    }
    return;
  }

  // ==================== HOOKS API ====================

  // API: Read hooks from settings.json
  // GET /api/hooks
  if (req.url === '/api/hooks' && req.method === 'GET') {
    try {
      const raw = fs.readFileSync(SETTINGS_JSON_PATH, 'utf8');
      const settings = JSON.parse(raw);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ hooks: settings.hooks || {}, path: SETTINGS_JSON_PATH }));
    } catch (e) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ hooks: {}, path: SETTINGS_JSON_PATH, error: e.message }));
    }
    return;
  }

  // API: Save hooks to settings.json
  // POST /api/hooks  { hooks: {...} }
  if (req.url === '/api/hooks' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { hooks } = JSON.parse(body);
        const raw = fs.readFileSync(SETTINGS_JSON_PATH, 'utf8');
        const settings = JSON.parse(raw);

        // Backup
        try { fs.copyFileSync(SETTINGS_JSON_PATH, SETTINGS_JSON_PATH + '.backup'); } catch (_) {}

        settings.hooks = hooks;
        fs.writeFileSync(SETTINGS_JSON_PATH, JSON.stringify(settings, null, 2), 'utf8');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // ==================== SKILLS API ====================

  // API: List all skills (from settings.json) with file content
  // GET /api/skills
  if (req.url === '/api/skills' && req.method === 'GET') {
    try {
      const raw = fs.readFileSync(SETTINGS_JSON_PATH, 'utf8');
      const settings = JSON.parse(raw);
      const skills = settings.skills || [];

      // Enrich with file content
      const enriched = skills.map(s => {
        let content = '';
        try {
          const normalizedPath = s.path.replace(/\//g, path.sep);
          content = fs.readFileSync(normalizedPath, 'utf8');
        } catch (_) {}
        return { ...s, content };
      });

      // Also scan skills dir for orphan files (not in settings.json)
      let orphans = [];
      try {
        const files = fs.readdirSync(SKILLS_DIR).filter(f => f.endsWith('.md'));
        const registeredPaths = skills.map(s => path.resolve(s.path.replace(/\//g, path.sep)));
        for (const f of files) {
          const fp = path.resolve(path.join(SKILLS_DIR, f));
          if (!registeredPaths.includes(fp)) {
            let content = '';
            try { content = fs.readFileSync(fp, 'utf8'); } catch (_) {}
            orphans.push({
              name: f.replace('.md', ''),
              description: '(not registered in settings.json)',
              path: fp.replace(/\\/g, '/'),
              content,
              orphan: true
            });
          }
        }
      } catch (_) {}

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ skills: enriched, orphans, settingsPath: SETTINGS_JSON_PATH, skillsDir: SKILLS_DIR }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // API: Save a skill file + update settings.json registry
  // POST /api/skills/save  { name, description, path, content, isNew }
  if (req.url === '/api/skills/save' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { name, description, content, isNew } = JSON.parse(body);
        const skillPath = path.join(SKILLS_DIR, name + '.md');

        // Ensure skills dir exists
        if (!fs.existsSync(SKILLS_DIR)) fs.mkdirSync(SKILLS_DIR, { recursive: true });

        // Write skill file
        fs.writeFileSync(skillPath, content, 'utf8');

        // Update settings.json
        const raw = fs.readFileSync(SETTINGS_JSON_PATH, 'utf8');
        const settings = JSON.parse(raw);
        if (!settings.skills) settings.skills = [];

        const skillEntry = {
          name,
          description: description || '',
          path: skillPath.replace(/\\/g, '\\\\')
        };

        const idx = settings.skills.findIndex(s => s.name === name);
        if (idx >= 0) {
          settings.skills[idx] = skillEntry;
        } else {
          settings.skills.push(skillEntry);
        }

        // Backup and write settings
        try { fs.copyFileSync(SETTINGS_JSON_PATH, SETTINGS_JSON_PATH + '.backup'); } catch (_) {}
        fs.writeFileSync(SETTINGS_JSON_PATH, JSON.stringify(settings, null, 2), 'utf8');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, path: skillPath }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // API: Delete a skill
  // POST /api/skills/delete  { name }
  if (req.url === '/api/skills/delete' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { name } = JSON.parse(body);

        // Remove from settings.json
        const raw = fs.readFileSync(SETTINGS_JSON_PATH, 'utf8');
        const settings = JSON.parse(raw);
        if (settings.skills) {
          settings.skills = settings.skills.filter(s => s.name !== name);
        }
        try { fs.copyFileSync(SETTINGS_JSON_PATH, SETTINGS_JSON_PATH + '.backup'); } catch (_) {}
        fs.writeFileSync(SETTINGS_JSON_PATH, JSON.stringify(settings, null, 2), 'utf8');

        // Delete skill file
        const skillPath = path.join(SKILLS_DIR, name + '.md');
        if (fs.existsSync(skillPath)) fs.unlinkSync(skillPath);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // ==================== SETTINGS LOCAL API ====================

  // API: Read settings.local.json
  // GET /api/settings-local
  if (req.url === '/api/settings-local' && req.method === 'GET') {
    fs.readFile(SETTINGS_LOCAL_PATH, 'utf8', (err, data) => {
      if (err) {
        // File may not exist yet — return empty object
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ data: {}, path: SETTINGS_LOCAL_PATH }));
        return;
      }
      try {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ data: JSON.parse(data), path: SETTINGS_LOCAL_PATH }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON in settings.local.json' }));
      }
    });
    return;
  }

  // API: Write settings.local.json
  // POST /api/settings-local
  if (req.url === '/api/settings-local' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        const pretty = JSON.stringify(parsed, null, 2);

        // Backup before writing
        const backupPath = SETTINGS_LOCAL_PATH + '.backup';
        try { fs.copyFileSync(SETTINGS_LOCAL_PATH, backupPath); } catch (_) {}

        fs.writeFile(SETTINGS_LOCAL_PATH, pretty, 'utf8', (err) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Write failed: ' + err.message }));
            return;
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, path: SETTINGS_LOCAL_PATH }));
        });
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON: ' + e.message }));
      }
    });
    return;
  }

  // ==================== TOOLS API ====================

  // API: Fetch tools from an MCP server via stdio JSON-RPC
  // GET /api/tools?name=serverName (but NOT /api/tools/ping which is handled later)
  if (req.url.startsWith('/api/tools') && !req.url.startsWith('/api/tools/ping') && req.method === 'GET') {
    const urlObj = new URL(req.url, `http://localhost:${PORT}`);
    const serverName = urlObj.searchParams.get('name');

    if (!serverName) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing ?name= parameter' }));
      return;
    }

    // Read current config to find the server (check both config files)
    let config;
    try {
      const raw = fs.readFileSync(CLAUDE_JSON_PATH, 'utf8');
      const data = JSON.parse(raw);
      config = (data.mcpServers && data.mcpServers[serverName])
            || (data.disabledMcpServers && data.disabledMcpServers[serverName]);
    } catch (_) {}
    if (!config) {
      try {
        const raw = fs.readFileSync(SETTINGS_JSON_PATH, 'utf8');
        const data = JSON.parse(raw);
        config = (data.mcpServers && data.mcpServers[serverName])
              || (data.disabledMcpServers && data.disabledMcpServers[serverName]);
      } catch (_) {}
    }

    if (!config) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Server "${serverName}" not found` }));
      return;
    }
    if (!config.command) {
      if (config.type === 'http' || config.url) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ server: serverName, tools: [], count: 0, note: 'HTTP server — tool listing not supported via stdio' }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Server "${serverName}" has no command` }));
      }
      return;
    }

    fetchMcpTools(config).then(result => {
      const tools = result.tools || result;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ server: serverName, tools, count: tools.length, stderr: result.stderr || '' }));
    }).catch(err => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ server: serverName, error: err.message, tools: [], count: 0 }));
    });
    return;
  }

  // ==================== CONVERSATIONS API ====================

  // List all conversation sessions
  if (req.url === '/api/conversations' && req.method === 'GET') {
    try {
      const sessions = [];
      if (fs.existsSync(CLAUDE_PROJECTS_DIR)) {
        for (const proj of fs.readdirSync(CLAUDE_PROJECTS_DIR)) {
          const projDir = path.join(CLAUDE_PROJECTS_DIR, proj);
          if (!fs.statSync(projDir).isDirectory()) continue;
          const files = fs.readdirSync(projDir).filter(f => f.endsWith('.jsonl'));
          for (const f of files) {
            const fp = path.join(projDir, f);
            const stat = fs.statSync(fp);
            // Read first and last lines for timestamps
            const raw = fs.readFileSync(fp, 'utf8');
            const lines = raw.split('\n').filter(l => l.trim());
            let firstTs = '', lastTs = '', msgCount = 0, firstMessage = '';
            for (const line of lines) {
              try {
                const obj = JSON.parse(line);
                if (obj.type === 'user' || obj.type === 'assistant') msgCount++;
                if (obj.type === 'user' && !firstMessage && obj.message) {
                  const content = typeof obj.message.content === 'string' ? obj.message.content : (obj.message.content && obj.message.content[0] && obj.message.content[0].text) || '';
                  firstMessage = content.slice(0, 100).replace(/\n/g, ' ').trim();
                }
                if (obj.timestamp) {
                  if (!firstTs) firstTs = obj.timestamp;
                  lastTs = obj.timestamp;
                }
              } catch (_) {}
            }
            sessions.push({
              project: proj.replace(/^([A-Za-z])--/, '$1:/').replace(/-/g, '/'),
              projectKey: proj,
              file: f,
              sessionId: f.replace('.jsonl', ''),
              size: stat.size,
              modified: stat.mtime,
              firstTimestamp: firstTs,
              lastTimestamp: lastTs,
              messageCount: msgCount,
              totalLines: lines.length,
              firstMessage
            });
          }
        }
      }
      sessions.sort((a, b) => new Date(b.modified) - new Date(a.modified));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ sessions: sessions.slice(0, 100) }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // Read a specific conversation session
  if (req.url.startsWith('/api/conversations/session') && req.method === 'GET') {
    const urlObj = new URL(req.url, `http://localhost:${PORT}`);
    const projectKey = urlObj.searchParams.get('project');
    const sessionId = urlObj.searchParams.get('id');
    if (!projectKey || !sessionId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing project or id parameter' }));
      return;
    }
    try {
      const fp = path.join(CLAUDE_PROJECTS_DIR, projectKey, sessionId + '.jsonl');
      if (!fs.existsSync(fp)) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Session not found' }));
        return;
      }
      const raw = fs.readFileSync(fp, 'utf8');
      const lines = raw.split('\n').filter(l => l.trim());
      const messages = [];
      for (const line of lines) {
        try {
          const obj = JSON.parse(line);
          if (obj.type === 'user' || obj.type === 'assistant') messages.push(obj);
        } catch (_) {}
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ messages, count: messages.length }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // Delete a conversation session
  // POST /api/conversations/delete  { project, id }
  if (req.url === '/api/conversations/delete' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { project, id } = JSON.parse(body);
        if (!project || !id) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing project or id' }));
          return;
        }
        const fp = path.join(CLAUDE_PROJECTS_DIR, project, id + '.jsonl');
        if (!fs.existsSync(fp)) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Session not found' }));
          return;
        }
        fs.unlinkSync(fp);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // ==================== CURRENCY API ====================

  if (req.url.startsWith('/api/currency') && req.method === 'GET') {
    const urlObj = new URL(req.url, `http://localhost:${PORT}`);
    const from = urlObj.searchParams.get('from') || 'USD';
    const to = urlObj.searchParams.get('to') || 'INR';
    const https = require('https');
    https.get(`https://api.frankfurter.app/latest?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, (apiRes) => {
      let data = '';
      apiRes.on('data', chunk => data += chunk);
      apiRes.on('end', () => {
        res.writeHead(apiRes.statusCode, { 'Content-Type': 'application/json' });
        res.end(data);
      });
    }).on('error', (e) => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    });
    return;
  }

  // ==================== FILE HISTORY API ====================

  if (req.url === '/api/file-history' && req.method === 'GET') {
    try {
      const groups = [];
      if (fs.existsSync(FILE_HISTORY_DIR)) {
        for (const dir of fs.readdirSync(FILE_HISTORY_DIR)) {
          const dp = path.join(FILE_HISTORY_DIR, dir);
          if (!fs.statSync(dp).isDirectory()) continue;
          const files = fs.readdirSync(dp);
          const stat = fs.statSync(dp);
          // Group versions by hash prefix
          const fileMap = {};
          for (const f of files) {
            const match = f.match(/^(.+?)@v(\d+)$/);
            if (match) {
              const hash = match[1];
              const ver = parseInt(match[2]);
              if (!fileMap[hash]) fileMap[hash] = [];
              fileMap[hash].push({ file: f, version: ver, size: fs.statSync(path.join(dp, f)).size });
            }
          }
          groups.push({
            id: dir,
            modified: stat.mtime,
            fileCount: Object.keys(fileMap).length,
            totalVersions: files.length,
            files: fileMap
          });
        }
      }
      groups.sort((a, b) => new Date(b.modified) - new Date(a.modified));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ groups }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  if (req.url.startsWith('/api/file-history/content') && req.method === 'GET') {
    const urlObj = new URL(req.url, `http://localhost:${PORT}`);
    const group = urlObj.searchParams.get('group');
    const file = urlObj.searchParams.get('file');
    if (!group || !file) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing group or file parameter' }));
      return;
    }
    try {
      const fp = path.join(FILE_HISTORY_DIR, group, file);
      if (!fs.existsSync(fp)) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'File not found' }));
        return;
      }
      const content = fs.readFileSync(fp, 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ content, file, group }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // API: Save file content to a chosen path (rollback)
  // POST /api/file-history/save-as  { content, targetPath }
  if (req.url === '/api/file-history/save-as' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { content, targetPath } = JSON.parse(body);
        if (!targetPath || !content) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing content or targetPath' }));
          return;
        }
        const normalized = targetPath.replace(/\//g, path.sep);
        // Backup existing file if it exists
        if (fs.existsSync(normalized)) {
          try { fs.copyFileSync(normalized, normalized + '.backup'); } catch (_) {}
        }
        fs.writeFileSync(normalized, content, 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, path: targetPath }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // ==================== DEBUG LOGS API ====================

  if (req.url === '/api/debug' && req.method === 'GET') {
    try {
      const DEBUG_DIR = path.join(CLAUDE_DIR, 'debug');
      const logs = [];
      if (fs.existsSync(DEBUG_DIR)) {
        for (const f of fs.readdirSync(DEBUG_DIR).filter(f => f.endsWith('.txt'))) {
          const fp = path.join(DEBUG_DIR, f);
          const stat = fs.statSync(fp);
          // Count errors/warnings from first pass
          const raw = fs.readFileSync(fp, 'utf8');
          const lines = raw.split('\n');
          const errorCount = lines.filter(l => l.includes('[ERROR]')).length;
          const warnCount = lines.filter(l => l.includes('[WARNING]') || l.includes('[WARN]')).length;
          logs.push({
            file: f,
            size: stat.size,
            modified: stat.mtime,
            lineCount: lines.length,
            errorCount,
            warnCount
          });
        }
      }
      logs.sort((a, b) => new Date(b.modified) - new Date(a.modified));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ logs }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  if (req.url.startsWith('/api/debug/content') && req.method === 'GET') {
    const urlObj = new URL(req.url, `http://localhost:${PORT}`);
    const file = urlObj.searchParams.get('file');
    if (!file || file.includes('..')) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid file parameter' }));
      return;
    }
    try {
      const fp = path.join(CLAUDE_DIR, 'debug', file);
      if (!fs.existsSync(fp)) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'File not found' }));
        return;
      }
      const content = fs.readFileSync(fp, 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ content, file }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // API: Common errors across all debug logs
  // GET /api/debug/common-errors
  if (req.url === '/api/debug/common-errors' && req.method === 'GET') {
    try {
      const DEBUG_DIR = path.join(CLAUDE_DIR, 'debug');
      const errorMap = {};  // message -> {count, files: Set, firstSeen, lastSeen}
      let totalErrors = 0;
      let filesScanned = 0;

      if (fs.existsSync(DEBUG_DIR)) {
        const files = fs.readdirSync(DEBUG_DIR).filter(f => f.endsWith('.txt'));
        filesScanned = files.length;

        for (const f of files) {
          const fp = path.join(DEBUG_DIR, f);
          const raw = fs.readFileSync(fp, 'utf8');
          const lines = raw.split('\n');
          const fileMod = fs.statSync(fp).mtime;

          for (const line of lines) {
            if (!line.includes('[ERROR]') && !line.includes('[WARNING]') && !line.includes('[WARN]')) continue;
            totalErrors++;

            // Extract the message part after [LEVEL]
            const msgMatch = line.match(/\[\w+\]\s*(.+)/);
            if (!msgMatch) continue;
            let msg = msgMatch[1].trim();

            // Normalize: remove timestamps, UUIDs, paths, specific values
            const normalized = msg
              .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '<UUID>')
              .replace(/\d{4}-\d{2}-\d{2}T[\d:.]+Z?/g, '<TIMESTAMP>')
              .replace(/[A-Za-z]:[\\\/][\w\\\/.-]+/g, '<PATH>')
              .replace(/\/[\w\/.-]+/g, '<PATH>')
              .replace(/\d{4,}/g, '<NUM>')
              .replace(/in \d+ms/g, 'in <N>ms')
              .replace(/\s+/g, ' ')
              .trim();

            if (!errorMap[normalized]) {
              errorMap[normalized] = { count: 0, files: new Set(), firstSeen: fileMod, lastSeen: fileMod, sample: msg, level: line.includes('[ERROR]') ? 'ERROR' : 'WARNING' };
            }
            errorMap[normalized].count++;
            errorMap[normalized].files.add(f);
            if (fileMod < errorMap[normalized].firstSeen) errorMap[normalized].firstSeen = fileMod;
            if (fileMod > errorMap[normalized].lastSeen) errorMap[normalized].lastSeen = fileMod;
          }
        }
      }

      // Convert to array, sort by count desc
      const commonErrors = Object.entries(errorMap)
        .map(([pattern, data]) => ({
          pattern,
          sample: data.sample,
          level: data.level,
          count: data.count,
          fileCount: data.files.size,
          firstSeen: data.firstSeen,
          lastSeen: data.lastSeen
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 50);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ commonErrors, totalErrors, filesScanned }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // ==================== MARKETPLACE / NPM SEARCH API ====================

  // Proxy npm registry search to avoid CORS
  // GET /api/npm/search?q=mcp-server&size=50&from=0
  if (req.url.startsWith('/api/npm/search') && req.method === 'GET') {
    const urlObj = new URL(req.url, `http://localhost:${PORT}`);
    const query = urlObj.searchParams.get('q') || 'mcp-server';
    const size = urlObj.searchParams.get('size') || '30';
    const from = urlObj.searchParams.get('from') || '0';

    const https = require('https');
    const npmUrl = `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=${size}&from=${from}`;

    https.get(npmUrl, (apiRes) => {
      let data = '';
      apiRes.on('data', chunk => data += chunk);
      apiRes.on('end', () => {
        res.writeHead(apiRes.statusCode, { 'Content-Type': 'application/json' });
        res.end(data);
      });
    }).on('error', (e) => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    });
    return;
  }

  // Get package details from npm
  // GET /api/npm/package?name=@modelcontextprotocol/server-github
  if (req.url.startsWith('/api/npm/package') && req.method === 'GET') {
    const urlObj = new URL(req.url, `http://localhost:${PORT}`);
    const name = urlObj.searchParams.get('name');
    if (!name) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing ?name= parameter' }));
      return;
    }

    const https = require('https');
    const npmUrl = `https://registry.npmjs.org/${encodeURIComponent(name).replace('%40', '@')}`;

    https.get(npmUrl, (apiRes) => {
      let data = '';
      apiRes.on('data', chunk => data += chunk);
      apiRes.on('end', () => {
        try {
          const pkg = JSON.parse(data);
          // Return a slim version
          const latest = pkg['dist-tags'] && pkg['dist-tags'].latest;
          const latestInfo = latest && pkg.versions && pkg.versions[latest];
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            name: pkg.name,
            description: pkg.description,
            latest,
            homepage: pkg.homepage,
            repository: pkg.repository,
            keywords: pkg.keywords,
            readme: (pkg.readme || '').slice(0, 3000),
            bin: latestInfo && latestInfo.bin,
            dependencies: latestInfo && latestInfo.dependencies
          }));
        } catch (_) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(data);
        }
      });
    }).on('error', (e) => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    });
    return;
  }

  // Install MCP server — add to settings.json mcpServers
  // POST /api/marketplace/install  { name, config: {command, args, env} }
  if (req.url === '/api/marketplace/install' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { name, config } = JSON.parse(body);
        if (!name || !config) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing name or config' }));
          return;
        }

        const raw = fs.readFileSync(SETTINGS_JSON_PATH, 'utf8');
        const settings = JSON.parse(raw);
        if (!settings.mcpServers) settings.mcpServers = {};

        // Check if already exists
        if (settings.mcpServers[name] || (settings.disabledMcpServers && settings.disabledMcpServers[name])) {
          res.writeHead(409, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: `Server "${name}" already exists` }));
          return;
        }

        // Backup and write
        try { fs.copyFileSync(SETTINGS_JSON_PATH, SETTINGS_JSON_PATH + '.backup'); } catch (_) {}
        settings.mcpServers[name] = config;
        fs.writeFileSync(SETTINGS_JSON_PATH, JSON.stringify(settings, null, 2), 'utf8');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, name }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // Uninstall MCP server — remove from settings.json
  // POST /api/marketplace/uninstall  { name }
  if (req.url === '/api/marketplace/uninstall' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { name } = JSON.parse(body);
        const raw = fs.readFileSync(SETTINGS_JSON_PATH, 'utf8');
        const settings = JSON.parse(raw);

        let found = false;
        if (settings.mcpServers && settings.mcpServers[name]) {
          delete settings.mcpServers[name]; found = true;
        }
        if (settings.disabledMcpServers && settings.disabledMcpServers[name]) {
          delete settings.disabledMcpServers[name]; found = true;
        }

        if (!found) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: `Server "${name}" not found` }));
          return;
        }

        try { fs.copyFileSync(SETTINGS_JSON_PATH, SETTINGS_JSON_PATH + '.backup'); } catch (_) {}
        fs.writeFileSync(SETTINGS_JSON_PATH, JSON.stringify(settings, null, 2), 'utf8');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // ==================== PLANS & TODOS API ====================

  if (req.url === '/api/plans' && req.method === 'GET') {
    try {
      const plans = [];
      if (fs.existsSync(PLANS_DIR)) {
        for (const f of fs.readdirSync(PLANS_DIR).filter(f => f.endsWith('.md'))) {
          const fp = path.join(PLANS_DIR, f);
          const stat = fs.statSync(fp);
          const content = fs.readFileSync(fp, 'utf8');
          plans.push({ file: f, name: f.replace('.md', ''), content, size: stat.size, modified: stat.mtime });
        }
      }
      const todos = [];
      if (fs.existsSync(TODOS_DIR)) {
        for (const f of fs.readdirSync(TODOS_DIR).filter(f => f.endsWith('.json'))) {
          try {
            const raw = fs.readFileSync(path.join(TODOS_DIR, f), 'utf8');
            const data = JSON.parse(raw);
            if (Array.isArray(data) && data.length > 0) todos.push({ file: f, items: data });
          } catch (_) {}
        }
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ plans, todos }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // ==================== CLAUDE.MD / DOCS API ====================

  if (req.url === '/api/docs' && req.method === 'GET') {
    try {
      const docs = [];
      // Scan common locations for CLAUDE.md
      const searchDirs = [HOME];
      // Also check project dirs
      if (fs.existsSync(CLAUDE_PROJECTS_DIR)) {
        for (const proj of fs.readdirSync(CLAUDE_PROJECTS_DIR)) {
          const decoded = proj.replace(/^([A-Za-z])--/, '$1:/').replace(/-/g, '/');
          if (fs.existsSync(decoded)) searchDirs.push(decoded);
        }
      }
      for (const dir of searchDirs) {
        for (const name of ['CLAUDE.md', '.claude/CLAUDE.md', 'CLAUDE.local.md', '.claude/CLAUDE.local.md']) {
          const fp = path.join(dir, name);
          if (fs.existsSync(fp)) {
            try {
              const content = fs.readFileSync(fp, 'utf8');
              const stat = fs.statSync(fp);
              docs.push({ path: fp.replace(/\\/g, '/'), dir: dir.replace(/\\/g, '/'), name, content, size: stat.size, modified: stat.mtime });
            } catch (_) {}
          }
        }
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ docs }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  if (req.url === '/api/docs/save' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { filePath, content } = JSON.parse(body);
        const normalized = filePath.replace(/\//g, path.sep);
        try { fs.copyFileSync(normalized, normalized + '.backup'); } catch (_) {}
        fs.writeFileSync(normalized, content, 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // ==================== BACKUPS API ====================

  if (req.url === '/api/backups' && req.method === 'GET') {
    try {
      const backups = [];
      // Check .claude.json backups in home
      const homeFiles = fs.readdirSync(HOME).filter(f => f.startsWith('.claude.json'));
      for (const f of homeFiles) {
        const fp = path.join(HOME, f);
        const stat = fs.statSync(fp);
        let valid = true;
        try { JSON.parse(fs.readFileSync(fp, 'utf8')); } catch (_) { valid = false; }
        backups.push({ file: f, path: fp.replace(/\\/g, '/'), size: stat.size, modified: stat.mtime, valid, type: 'config' });
      }
      // Check backups dir
      if (fs.existsSync(BACKUPS_DIR)) {
        for (const f of fs.readdirSync(BACKUPS_DIR)) {
          const fp = path.join(BACKUPS_DIR, f);
          const stat = fs.statSync(fp);
          let valid = true;
          try { if (f.endsWith('.json')) JSON.parse(fs.readFileSync(fp, 'utf8')); } catch (_) { valid = false; }
          backups.push({ file: f, path: fp.replace(/\\/g, '/'), size: stat.size, modified: stat.mtime, valid, type: 'backup' });
        }
      }
      // Settings backups
      for (const p of [SETTINGS_JSON_PATH + '.backup', SETTINGS_LOCAL_PATH + '.backup']) {
        if (fs.existsSync(p)) {
          const stat = fs.statSync(p);
          backups.push({ file: path.basename(p), path: p.replace(/\\/g, '/'), size: stat.size, modified: stat.mtime, valid: true, type: 'settings' });
        }
      }
      backups.sort((a, b) => new Date(b.modified) - new Date(a.modified));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ backups }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  if (req.url === '/api/backups/content' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { filePath } = JSON.parse(body);
        const content = fs.readFileSync(filePath.replace(/\//g, path.sep), 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ content }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  if (req.url === '/api/backups/restore' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { filePath, targetPath } = JSON.parse(body);
        const src = filePath.replace(/\//g, path.sep);
        const dst = (targetPath || CLAUDE_JSON_PATH).replace(/\//g, path.sep);
        try { fs.copyFileSync(dst, dst + '.pre-restore.backup'); } catch (_) {}
        fs.copyFileSync(src, dst);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // ==================== KEYBINDINGS API ====================

  if (req.url === '/api/keybindings' && req.method === 'GET') {
    try {
      let data = [];
      if (fs.existsSync(KEYBINDINGS_PATH)) {
        data = JSON.parse(fs.readFileSync(KEYBINDINGS_PATH, 'utf8'));
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ keybindings: data, path: KEYBINDINGS_PATH }));
    } catch (e) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ keybindings: [], path: KEYBINDINGS_PATH }));
    }
    return;
  }

  if (req.url === '/api/keybindings' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { keybindings } = JSON.parse(body);
        fs.writeFileSync(KEYBINDINGS_PATH, JSON.stringify(keybindings, null, 2), 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // ==================== PLUGINS API ====================

  if (req.url === '/api/plugins' && req.method === 'GET') {
    try {
      const result = { installed: [], enabledPlugins: {} };
      // Read enabled plugins from settings
      try {
        const settings = JSON.parse(fs.readFileSync(SETTINGS_JSON_PATH, 'utf8'));
        result.enabledPlugins = settings.enabledPlugins || {};
        result.extraKnownMarketplaces = settings.extraKnownMarketplaces || {};
      } catch (_) {}
      // Scan plugins dir
      if (fs.existsSync(PLUGINS_DIR)) {
        const getDirSize = (dir) => {
          let size = 0;
          try {
            const items = fs.readdirSync(dir);
            for (const item of items) {
              const fp = path.join(dir, item);
              const stat = fs.statSync(fp);
              size += stat.isDirectory() ? getDirSize(fp) : stat.size;
            }
          } catch (_) {}
          return size;
        };
        for (const sub of ['marketplaces', 'cache']) {
          const subDir = path.join(PLUGINS_DIR, sub);
          if (!fs.existsSync(subDir)) continue;
          for (const name of fs.readdirSync(subDir)) {
            const plugDir = path.join(subDir, name);
            if (!fs.statSync(plugDir).isDirectory()) continue;
            const size = getDirSize(plugDir);
            result.installed.push({ name, location: sub, size, path: plugDir.replace(/\\/g, '/') });
          }
        }
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // ==================== SESSIONS API ====================

  if (req.url.startsWith('/api/sessions') && req.method === 'GET') {
    try {
      const sessions = [];
      if (fs.existsSync(CLAUDE_PROJECTS_DIR)) {
        for (const proj of fs.readdirSync(CLAUDE_PROJECTS_DIR)) {
          const projDir = path.join(CLAUDE_PROJECTS_DIR, proj);
          const files = fs.readdirSync(projDir).filter(f => f.endsWith('.jsonl'));
          for (const f of files) {
            const fp = path.join(projDir, f);
            const stat = fs.statSync(fp);
            const raw = fs.readFileSync(fp, 'utf8');
            const allLines = raw.split('\n').filter(l => l.trim());
            // Extract topic from first user message
            let topic = '';
            for (const line of allLines) {
              try {
                const obj = JSON.parse(line);
                if (obj.type === 'user' && obj.message) {
                  const content = typeof obj.message.content === 'string' ? obj.message.content : (obj.message.content && obj.message.content[0] && obj.message.content[0].text) || '';
                  topic = content.slice(0, 80).replace(/\n/g, ' ').trim();
                  break;
                }
              } catch (_) {}
            }
            sessions.push({
              project: proj.replace(/^([A-Za-z])--/, '$1:/').replace(/-/g, '/'),
              projectKey: proj,
              file: f, sessionId: f.replace('.jsonl', ''),
              size: stat.size, modified: stat.mtime, messages: allLines.length, topic
            });
          }
        }
      }
      sessions.sort((a, b) => new Date(b.modified) - new Date(a.modified));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ sessions: sessions.slice(0, 200), total: sessions.length }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // ==================== STORAGE API ====================

  if (req.url === '/api/storage' && req.method === 'GET') {
    try {
      const getDirSize = (dir) => {
        let size = 0, count = 0;
        try {
          const items = fs.readdirSync(dir);
          for (const item of items) {
            const fp = path.join(dir, item);
            const stat = fs.statSync(fp);
            if (stat.isDirectory()) { const sub = getDirSize(fp); size += sub.size; count += sub.count; }
            else { size += stat.size; count++; }
          }
        } catch (_) {}
        return { size, count };
      };

      const dirs = ['plugins', 'projects', 'file-history', 'debug', 'todos', 'shell-snapshots',
                     'backups', 'telemetry', 'statsig', 'cache', 'plans', 'paste-cache',
                     'skills', 'sessions', 'tasks', 'hooks', 'ide', 'chrome', 'downloads'];
      const breakdown = [];
      for (const d of dirs) {
        const dp = path.join(CLAUDE_DIR, d);
        if (fs.existsSync(dp)) {
          const info = getDirSize(dp);
          breakdown.push({ name: d, ...info, path: dp.replace(/\\/g, '/') });
        }
      }
      // Top-level files
      let topSize = 0;
      for (const f of fs.readdirSync(CLAUDE_DIR).filter(f => !fs.statSync(path.join(CLAUDE_DIR, f)).isDirectory())) {
        topSize += fs.statSync(path.join(CLAUDE_DIR, f)).size;
      }
      breakdown.push({ name: '(config files)', size: topSize, count: fs.readdirSync(CLAUDE_DIR).filter(f => !fs.statSync(path.join(CLAUDE_DIR, f)).isDirectory()).length });
      breakdown.sort((a, b) => b.size - a.size);
      const total = breakdown.reduce((s, d) => s + d.size, 0);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ breakdown, total, claudeDir: CLAUDE_DIR.replace(/\\/g, '/') }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // ==================== HEALTH API ====================

  if (req.url === '/api/health' && req.method === 'GET') {
    try {
      const checks = [];
      // Config files
      for (const [name, fp] of [['claude.json', CLAUDE_JSON_PATH], ['settings.json', SETTINGS_JSON_PATH], ['settings.local.json', SETTINGS_LOCAL_PATH]]) {
        let status = 'missing';
        let detail = '';
        if (fs.existsSync(fp)) {
          try { JSON.parse(fs.readFileSync(fp, 'utf8')); status = 'ok'; } catch (e) { status = 'invalid'; detail = e.message; }
        }
        checks.push({ name, status, detail, path: fp.replace(/\\/g, '/') });
      }
      // Credentials
      if (fs.existsSync(CREDENTIALS_PATH)) {
        try {
          const creds = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
          const expired = creds.expiresAt ? new Date(creds.expiresAt) < new Date() : false;
          checks.push({ name: 'OAuth Credentials', status: expired ? 'warning' : 'ok', detail: expired ? 'Token expired' : 'Valid until ' + new Date(creds.expiresAt).toLocaleString() });
        } catch (_) { checks.push({ name: 'OAuth Credentials', status: 'invalid' }); }
      } else {
        checks.push({ name: 'OAuth Credentials', status: 'missing', detail: 'Using API key auth' });
      }
      // Stats freshness
      if (fs.existsSync(STATS_CACHE_PATH)) {
        try {
          const stats = JSON.parse(fs.readFileSync(STATS_CACHE_PATH, 'utf8'));
          const today = new Date().toISOString().slice(0, 10);
          const stale = stats.lastComputedDate < today;
          checks.push({ name: 'Stats Cache', status: stale ? 'warning' : 'ok', detail: 'Last computed: ' + stats.lastComputedDate });
        } catch (_) {}
      }
      // Directories
      for (const [name, dp] of [['Skills Dir', SKILLS_DIR], ['Plans Dir', PLANS_DIR], ['Plugins Dir', PLUGINS_DIR], ['Projects Dir', CLAUDE_PROJECTS_DIR]]) {
        checks.push({ name, status: fs.existsSync(dp) ? 'ok' : 'missing' });
      }
      // MCP servers count — match Servers page (reads .claude.json)
      try {
        const config = JSON.parse(fs.readFileSync(CLAUDE_JSON_PATH, 'utf8'));
        const enabled = Object.keys(config.mcpServers || {}).length;
        const disabled = Object.keys(config.disabledMcpServers || {}).length;
        checks.push({ name: 'MCP Servers', status: 'ok', detail: `${enabled} enabled, ${disabled} disabled` });
      } catch (_) {}

      // Account info from credentials
      let account = null;
      try {
        const creds = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
        const oauth = creds.claudeAiOauth || creds;
        account = {
          subscriptionType: oauth.subscriptionType || 'unknown',
          rateLimitTier: oauth.rateLimitTier || 'unknown',
          expiresAt: oauth.expiresAt,
          expired: oauth.expiresAt ? oauth.expiresAt < Date.now() : null,
          expiresIn: oauth.expiresAt ? Math.max(0, Math.round((oauth.expiresAt - Date.now()) / 60000)) : null,
          scopes: oauth.scopes || []
        };
      } catch (_) {}

      // Try to get email from claude auth status (cached)
      try {
        const { execSync } = require('child_process');
        const authOut = execSync('claude auth status 2>&1', { timeout: 5000, encoding: 'utf8' });
        const parsed = JSON.parse(authOut);
        if (parsed.email) account = { ...account, email: parsed.email, orgName: parsed.orgName };
      } catch (_) {}

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ checks, account, timestamp: new Date().toISOString() }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // ==================== MCP PING API ====================

  // Ping an MCP server — test connection and measure response time
  // GET /api/tools/ping?name=serverName
  if (req.url.startsWith('/api/tools/ping') && req.method === 'GET') {
    const urlObj = new URL(req.url, `http://localhost:${PORT}`);
    const serverName = urlObj.searchParams.get('name');
    if (!serverName) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing ?name= parameter' }));
      return;
    }

    // Find server config across all config files
    let config;
    try {
      const raw = fs.readFileSync(CLAUDE_JSON_PATH, 'utf8');
      const data = JSON.parse(raw);
      config = (data.mcpServers && data.mcpServers[serverName])
            || (data.disabledMcpServers && data.disabledMcpServers[serverName]);
    } catch (_) {}
    if (!config) {
      try {
        const raw = fs.readFileSync(SETTINGS_JSON_PATH, 'utf8');
        const data = JSON.parse(raw);
        config = (data.mcpServers && data.mcpServers[serverName])
              || (data.disabledMcpServers && data.disabledMcpServers[serverName]);
      } catch (_) {}
    }

    if (!config) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'error', error: 'Server not found in any config file' }));
      return;
    }

    // HTTP-type servers can't be spawned — just report as reachable
    if (config.type === 'http' || config.url) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', server: serverName, responseTimeMs: 0, toolCount: 0, note: 'HTTP server — ping not supported, check URL manually: ' + (config.url || '') }));
      return;
    }

    if (!config.command) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'error', server: serverName, error: 'No command defined for this server' }));
      return;
    }

    const startTime = Date.now();
    fetchMcpTools(config).then(result => {
      const tools = result.tools || result;
      const elapsed = Date.now() - startTime;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', server: serverName, responseTimeMs: elapsed, toolCount: tools.length, stderr: result.stderr || '' }));
    }).catch(err => {
      const elapsed = Date.now() - startTime;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'error', server: serverName, responseTimeMs: elapsed, error: err.message }));
    });
    return;
  }

  // ==================== CONFIG DOCTOR API ====================

  // Deep config validation
  // GET /api/health/doctor
  if (req.url === '/api/health/doctor' && req.method === 'GET') {
    try {
      const issues = [];

      // 1. Validate JSON syntax of all config files
      for (const [name, fp] of [['claude.json', CLAUDE_JSON_PATH], ['settings.json', SETTINGS_JSON_PATH], ['settings.local.json', SETTINGS_LOCAL_PATH]]) {
        if (fs.existsSync(fp)) {
          try { JSON.parse(fs.readFileSync(fp, 'utf8')); issues.push({ check: `${name} syntax`, status: 'pass', detail: 'Valid JSON' }); }
          catch (e) { issues.push({ check: `${name} syntax`, status: 'fail', detail: 'Invalid JSON: ' + e.message, fix: 'Fix JSON syntax errors in ' + name }); }
        } else if (name !== 'settings.local.json') {
          issues.push({ check: `${name} exists`, status: 'warn', detail: 'File not found', fix: 'Create ' + name + ' or run claude init' });
        }
      }

      // 2. Check for duplicate MCP servers across files
      let claudeServers = {}, settingsServers = {};
      try { claudeServers = { ...(JSON.parse(fs.readFileSync(CLAUDE_JSON_PATH, 'utf8')).mcpServers || {}), ...(JSON.parse(fs.readFileSync(CLAUDE_JSON_PATH, 'utf8')).disabledMcpServers || {}) }; } catch (_) {}
      try { settingsServers = { ...(JSON.parse(fs.readFileSync(SETTINGS_JSON_PATH, 'utf8')).mcpServers || {}), ...(JSON.parse(fs.readFileSync(SETTINGS_JSON_PATH, 'utf8')).disabledMcpServers || {}) }; } catch (_) {}

      const dupes = Object.keys(claudeServers).filter(k => settingsServers[k]);
      if (dupes.length > 0) {
        issues.push({ check: 'Duplicate MCP servers', status: 'warn', detail: `${dupes.length} server(s) defined in BOTH claude.json and settings.json: ${dupes.join(', ')}`, fix: 'Remove duplicates — keep in one file only' });
      } else {
        issues.push({ check: 'Duplicate MCP servers', status: 'pass', detail: 'No duplicates found' });
      }

      // 3. Validate MCP server commands exist
      const allServers = { ...claudeServers, ...settingsServers };
      const { execSync } = require('child_process');
      for (const [name, config] of Object.entries(allServers)) {
        if (!config.command) continue;
        const cmd = config.command.replace('.cmd', '').replace('.exe', '');
        try {
          const whichCmd = process.platform === 'win32' ? 'where' : 'which';
          execSync(`${whichCmd} ${cmd} 2>&1`, { encoding: 'utf8', timeout: 3000 });
          issues.push({ check: `${name}: command "${config.command}"`, status: 'pass', detail: 'Found on PATH' });
        } catch (_) {
          if (['npx', 'uvx', 'node', 'bun'].includes(cmd)) {
            issues.push({ check: `${name}: command "${config.command}"`, status: 'pass', detail: 'Standard runtime' });
          } else {
            issues.push({ check: `${name}: command "${config.command}"`, status: 'warn', detail: 'Not found on PATH', fix: `Ensure ${config.command} is installed and on PATH` });
          }
        }
      }

      // 4. Check for missing env vars + known correct names
      const KNOWN_ENV_VARS = {
        'github': ['GITHUB_TOKEN'],
        'slack': ['SLACK_BOT_TOKEN', 'SLACK_TEAM_ID'],
        'notion': ['OPENAPI_MCP_HEADERS'],
        'supabase': ['SUPABASE_ACCESS_TOKEN'],
        'firecrawl': ['FIRECRAWL_API_KEY'],
        'e2b': ['E2B_API_KEY'],
        'mem0': ['MEM0_API_KEY'],
        'youtube': ['YOUTUBE_API_KEY'],
        'agentql': ['AGENTQL_API_KEY'],
        'context7': ['CONTEXT7_API_KEY'],
        'playwright': [],
        'puppeteer': [],
        'filesystem': [],
        'sequential-thinking': [],
      };
      for (const [name, config] of Object.entries(allServers)) {
        if (!config.env) {
          // Check if this server should have env vars
          const known = KNOWN_ENV_VARS[name];
          if (known && known.length > 0) {
            issues.push({ check: `${name}: missing env vars`, status: 'warn', detail: `Expected: ${known.join(', ')}`, fix: `Add env vars to ${name} config` });
          }
          continue;
        }
        for (const [key, val] of Object.entries(config.env)) {
          if (!val || val === '' || val.includes('YOUR_') || val.includes('_HERE')) {
            issues.push({ check: `${name}: env ${key}`, status: 'warn', detail: 'Placeholder or empty value', fix: `Set a valid value for ${key} in ${name} config` });
          }
        }
        // Check for wrong env var names
        const known = KNOWN_ENV_VARS[name];
        if (known && known.length > 0) {
          const configKeys = Object.keys(config.env);
          for (const expected of known) {
            if (!configKeys.some(k => k.includes(expected) || expected.includes(k))) {
              issues.push({ check: `${name}: env var name`, status: 'warn', detail: `Expected "${expected}" but found: ${configKeys.join(', ')}`, fix: `Rename env var to ${expected}` });
            }
          }
        }
      }

      // 5. Check credentials expiry
      try {
        const creds = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
        const oauth = creds.claudeAiOauth || creds;
        if (oauth.expiresAt && oauth.expiresAt < Date.now()) {
          issues.push({ check: 'OAuth token', status: 'fail', detail: 'Token expired', fix: 'Run: claude login' });
        } else {
          issues.push({ check: 'OAuth token', status: 'pass', detail: 'Valid' });
        }
      } catch (_) {
        issues.push({ check: 'OAuth token', status: 'warn', detail: 'No credentials file', fix: 'Run: claude login' });
      }

      // 6. Check permissions.deny references
      try {
        const settings = JSON.parse(fs.readFileSync(SETTINGS_LOCAL_PATH, 'utf8'));
        const deny = (settings.permissions && settings.permissions.deny) || [];
        const mcpDeny = deny.filter(d => d.startsWith('mcp__'));
        for (const d of mcpDeny) {
          const parts = d.split('__');
          const serverRef = parts[1];
          if (!allServers[serverRef]) {
            issues.push({ check: `Denied tool: ${d}`, status: 'warn', detail: `Server "${serverRef}" not found in any config`, fix: 'Remove stale deny entry or add the server' });
          }
        }
        if (mcpDeny.length > 0 && mcpDeny.every(d => allServers[d.split('__')[1]])) {
          issues.push({ check: 'Permissions.deny references', status: 'pass', detail: `${mcpDeny.length} tool deny entries, all valid` });
        }
      } catch (_) {}

      const passCount = issues.filter(i => i.status === 'pass').length;
      const warnCount = issues.filter(i => i.status === 'warn').length;
      const failCount = issues.filter(i => i.status === 'fail').length;

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ issues, summary: { pass: passCount, warn: warnCount, fail: failCount } }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // ==================== MODELS / OPENROUTER API ====================

  // List OpenRouter models
  // Check OpenRouter key from env
  if (req.url === '/api/models/env-key' && req.method === 'GET') {
    const key = process.env.OPENROUTER_API_KEY || '';
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ hasKey: !!key, keyPreview: key ? key.slice(0, 8) + '...' : '' }));
    return;
  }

  if (req.url.startsWith('/api/models/list') && req.method === 'GET') {
    const https = require('https');
    const apiKey = process.env.OPENROUTER_API_KEY || '';
    const options = {
      hostname: 'openrouter.ai',
      path: '/api/v1/models',
      method: 'GET',
      headers: apiKey ? { 'Authorization': 'Bearer ' + apiKey } : {}
    };
    const apiReq = https.request(options, (apiRes) => {
      let data = '';
      apiRes.on('data', chunk => data += chunk);
      apiRes.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const models = (parsed.data || []).map(m => ({
            id: m.id, name: m.name || m.id, pricing: m.pricing,
            context_length: m.context_length, description: m.description
          }));
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ models, total: models.length, hasApiKey: !!apiKey }));
        } catch (_) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(data);
        }
      });
    });
    apiReq.on('error', (e) => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    });
    apiReq.end();
    return;
  }

  // Create model alias (.bat file on Windows, .sh on Unix)
  if (req.url === '/api/models/create-alias' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { aliasName, modelId, apiKey } = JSON.parse(body);
        if (!aliasName || !modelId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing aliasName or modelId' }));
          return;
        }
        const aliasDir = path.join(__dirname, 'aliases');
        if (!fs.existsSync(aliasDir)) fs.mkdirSync(aliasDir, { recursive: true });

        const isWin = process.platform === 'win32';
        const ext = isWin ? '.bat' : '.sh';
        const fp = path.join(aliasDir, aliasName + ext);

        // Generate PowerShell function (append to profile) + .bat file
        const psFunction = `\nfunction ${aliasName} {\n    $env:ANTHROPIC_BASE_URL = "https://openrouter.ai/api"\n    $env:ANTHROPIC_AUTH_TOKEN = "${apiKey}"\n    $env:ANTHROPIC_API_KEY = ""\n    $env:ANTHROPIC_MODEL = "${modelId}"\n    claude\n}\n`;

        let content;
        if (isWin) {
          // Create .bat file for cmd.exe
          content = `@echo off\r\nset ANTHROPIC_BASE_URL=https://openrouter.ai/api\r\nset ANTHROPIC_AUTH_TOKEN=${apiKey}\r\nset ANTHROPIC_API_KEY=\r\nset ANTHROPIC_MODEL=${modelId}\r\nclaude %*\r\n`;
        } else {
          content = `#!/bin/bash\nexport ANTHROPIC_BASE_URL="https://openrouter.ai/api"\nexport ANTHROPIC_AUTH_TOKEN="${apiKey}"\nexport ANTHROPIC_API_KEY=""\nexport ANTHROPIC_MODEL="${modelId}"\nclaude "$@"\n`;
        }

        fs.writeFileSync(fp, content, 'utf8');
        if (!isWin) fs.chmodSync(fp, '755');

        // Also append to PowerShell profile if on Windows
        let psProfilePath = '';
        if (isWin) {
          const psProfiles = [
            path.join(HOME, 'OneDrive', 'Documents', 'WindowsPowerShell', 'Microsoft.PowerShell_profile.ps1'),
            path.join(HOME, 'Documents', 'WindowsPowerShell', 'Microsoft.PowerShell_profile.ps1'),
          ];
          for (const p of psProfiles) {
            if (fs.existsSync(p)) { psProfilePath = p; break; }
          }
          if (psProfilePath) {
            const existing = fs.readFileSync(psProfilePath, 'utf8');
            if (!existing.includes(`function ${aliasName}`)) {
              fs.appendFileSync(psProfilePath, psFunction, 'utf8');
            }
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, path: fp.replace(/\\/g, '/'), aliasName, psProfile: psProfilePath ? 'Added to PowerShell profile' : 'No PS profile found' }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // List existing aliases — check dashboard aliases/ folder AND PowerShell profile
  if (req.url === '/api/models/aliases' && req.method === 'GET') {
    try {
      const aliasDir = path.join(__dirname, 'aliases');
      const aliases = [];

      // Check dashboard aliases/ folder
      if (fs.existsSync(aliasDir)) {
        for (const f of fs.readdirSync(aliasDir)) {
          const fp = path.join(aliasDir, f);
          const content = fs.readFileSync(fp, 'utf8');
          const modelMatch = content.match(/--model\s+(\S+)/) || content.match(/ANTHROPIC_MODEL\s*=\s*"?([^"\s]+)/);
          aliases.push({ file: f, name: f.replace(/\.(bat|sh|ps1)$/, ''), model: modelMatch ? modelMatch[1] : '', path: fp.replace(/\\/g, '/'), source: 'dashboard' });
        }
      }

      // Check PowerShell profile for claude-* functions
      const psProfilePaths = [
        path.join(HOME, 'OneDrive', 'Documents', 'WindowsPowerShell', 'Microsoft.PowerShell_profile.ps1'),
        path.join(HOME, 'Documents', 'WindowsPowerShell', 'Microsoft.PowerShell_profile.ps1'),
        path.join(HOME, 'Documents', 'PowerShell', 'Microsoft.PowerShell_profile.ps1'),
      ];
      for (const psPath of psProfilePaths) {
        if (!fs.existsSync(psPath)) continue;
        const content = fs.readFileSync(psPath, 'utf8');
        // Match PowerShell functions like: function claude-minimax {
        const funcRegex = /function\s+(claude-\w+)\s*\{([^}]+)\}/gi;
        let match;
        while ((match = funcRegex.exec(content)) !== null) {
          const funcName = match[1];
          const funcBody = match[2];
          const modelMatch = funcBody.match(/ANTHROPIC_MODEL\s*=\s*"?([^"\s\r\n]+)/);
          const baseUrl = funcBody.match(/ANTHROPIC_BASE_URL\s*=\s*"?([^"\s\r\n]+)/);
          aliases.push({
            name: funcName,
            model: modelMatch ? modelMatch[1] : '',
            baseUrl: baseUrl ? baseUrl[1] : '',
            source: 'powershell-profile',
            path: psPath.replace(/\\/g, '/'),
          });
        }
        break; // use first found profile
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ aliases, aliasDir: (aliasDir).replace(/\\/g, '/') }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // Delete alias
  if (req.url === '/api/models/delete-alias' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { name } = JSON.parse(body);
        const aliasDir = path.join(__dirname, 'aliases');
        for (const ext of ['.bat', '.sh']) {
          const fp = path.join(aliasDir, name + ext);
          if (fs.existsSync(fp)) fs.unlinkSync(fp);
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // ==================== HIDDEN DATA APIs ====================

  // Paste History — browse paste-cache
  if (req.url === '/api/paste-history' && req.method === 'GET') {
    try {
      const pasteDir = path.join(CLAUDE_DIR, 'paste-cache');
      const pastes = [];
      if (fs.existsSync(pasteDir)) {
        for (const f of fs.readdirSync(pasteDir)) {
          const fp = path.join(pasteDir, f);
          const stat = fs.statSync(fp);
          if (stat.isFile() && stat.size > 0) {
            const content = fs.readFileSync(fp, 'utf8');
            pastes.push({ file: f, size: stat.size, modified: stat.mtime, preview: content.slice(0, 200), content });
          }
        }
      }
      // Also extract pastedContents from history.jsonl
      const histPastes = [];
      if (fs.existsSync(HISTORY_PATH)) {
        const lines = fs.readFileSync(HISTORY_PATH, 'utf8').split('\n').filter(l => l.trim());
        for (const line of lines) {
          try {
            const obj = JSON.parse(line);
            if (obj.pastedContents && Object.keys(obj.pastedContents).length > 0) {
              for (const [key, val] of Object.entries(obj.pastedContents)) {
                histPastes.push({ source: 'history', key, preview: String(val).slice(0, 200), content: String(val), timestamp: obj.timestamp, prompt: obj.display });
              }
            }
          } catch (_) {}
        }
      }
      pastes.sort((a, b) => new Date(b.modified) - new Date(a.modified));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ pastes, historyPastes: histPastes, total: pastes.length + histPastes.length }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // Shell Snapshots
  if (req.url === '/api/shell-snapshots' && req.method === 'GET') {
    try {
      const snapDir = path.join(CLAUDE_DIR, 'shell-snapshots');
      const snaps = [];
      if (fs.existsSync(snapDir)) {
        for (const f of fs.readdirSync(snapDir)) {
          const fp = path.join(snapDir, f);
          const stat = fs.statSync(fp);
          const content = fs.readFileSync(fp, 'utf8');
          snaps.push({ file: f, size: stat.size, modified: stat.mtime, content, lineCount: content.split('\n').length });
        }
      }
      snaps.sort((a, b) => new Date(b.modified) - new Date(a.modified));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ snapshots: snaps }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // MCP Auth Status
  if (req.url === '/api/mcp-auth' && req.method === 'GET') {
    try {
      const authPath = path.join(CLAUDE_DIR, 'mcp-needs-auth-cache.json');
      let data = {};
      if (fs.existsSync(authPath)) data = JSON.parse(fs.readFileSync(authPath, 'utf8'));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ needsAuth: data }));
    } catch (e) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ needsAuth: {} }));
    }
    return;
  }

  // Feature Flags (Statsig)
  if (req.url === '/api/feature-flags' && req.method === 'GET') {
    try {
      const statsigDir = path.join(CLAUDE_DIR, 'statsig');
      const flags = {};
      if (fs.existsSync(statsigDir)) {
        for (const f of fs.readdirSync(statsigDir)) {
          const fp = path.join(statsigDir, f);
          try {
            const content = fs.readFileSync(fp, 'utf8');
            flags[f] = JSON.parse(content);
          } catch (_) {
            flags[f] = { raw: fs.readFileSync(fp, 'utf8').slice(0, 500) };
          }
        }
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ flags }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // Privacy / Telemetry Audit
  if (req.url === '/api/telemetry' && req.method === 'GET') {
    try {
      const teleDir = path.join(CLAUDE_DIR, 'telemetry');
      const files = [];
      if (fs.existsSync(teleDir)) {
        for (const f of fs.readdirSync(teleDir)) {
          const fp = path.join(teleDir, f);
          const stat = fs.statSync(fp);
          let eventCount = 0, preview = '';
          try {
            const content = fs.readFileSync(fp, 'utf8');
            const parsed = JSON.parse(content);
            eventCount = Array.isArray(parsed) ? parsed.length : (parsed.events ? parsed.events.length : 1);
            preview = JSON.stringify(parsed).slice(0, 300);
          } catch (_) { preview = fs.readFileSync(fp, 'utf8').slice(0, 300); }
          files.push({ file: f, size: stat.size, modified: stat.mtime, eventCount, preview });
        }
      }
      const totalSize = files.reduce((s, f) => s + f.size, 0);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ files, totalSize, count: files.length }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // Common prompts from history (for auto-populating prompt library)
  if (req.url === '/api/common-prompts' && req.method === 'GET') {
    try {
      const promptMap = {};
      if (fs.existsSync(HISTORY_PATH)) {
        const lines = fs.readFileSync(HISTORY_PATH, 'utf8').split('\n').filter(l => l.trim());
        for (const line of lines) {
          try {
            const obj = JSON.parse(line);
            if (obj.display && obj.display.length > 10 && obj.display.length < 500) {
              const key = obj.display.toLowerCase().trim();
              if (!promptMap[key]) promptMap[key] = { text: obj.display, count: 0, lastUsed: obj.timestamp, project: obj.project };
              promptMap[key].count++;
              if (obj.timestamp > promptMap[key].lastUsed) promptMap[key].lastUsed = obj.timestamp;
            }
          } catch (_) {}
        }
      }
      const prompts = Object.values(promptMap)
        .filter(p => p.count >= 2 || p.text.length > 30)
        .sort((a, b) => b.count - a.count)
        .slice(0, 50);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ prompts }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // ==================== CONVERSATION EXPORT API ====================

  // Export conversation as markdown
  // GET /api/conversations/export?project=X&id=Y
  if (req.url.startsWith('/api/conversations/export') && req.method === 'GET') {
    const urlObj = new URL(req.url, `http://localhost:${PORT}`);
    const projectKey = urlObj.searchParams.get('project');
    const sessionId = urlObj.searchParams.get('id');
    if (!projectKey || !sessionId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing project or id' }));
      return;
    }
    try {
      const fp = path.join(CLAUDE_PROJECTS_DIR, projectKey, sessionId + '.jsonl');
      if (!fs.existsSync(fp)) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Session not found' }));
        return;
      }
      const raw = fs.readFileSync(fp, 'utf8');
      const lines = raw.split('\n').filter(l => l.trim());
      const project = projectKey.replace(/^([A-Za-z])--/, '$1:/').replace(/-/g, '/');
      let md = `# Conversation: ${sessionId}\n\n`;
      md += `**Project:** ${project}  \n`;
      md += `**Date:** ${new Date(fs.statSync(fp).mtime).toLocaleString()}  \n\n---\n\n`;

      for (const line of lines) {
        try {
          const obj = JSON.parse(line);
          if (obj.type === 'user' && obj.message) {
            md += `## User\n\n`;
            if (typeof obj.message.content === 'string') {
              md += obj.message.content + '\n\n';
            } else if (Array.isArray(obj.message.content)) {
              for (const c of obj.message.content) {
                if (c.type === 'text') md += c.text + '\n\n';
                else if (c.type === 'tool_result') md += `> **Tool Result** (${c.tool_use_id}):\n> ${(c.content || '').slice(0, 500)}\n\n`;
              }
            }
          } else if (obj.type === 'assistant' && obj.message) {
            md += `## Claude\n\n`;
            if (Array.isArray(obj.message.content)) {
              for (const c of obj.message.content) {
                if (c.type === 'text') md += c.text + '\n\n';
                else if (c.type === 'tool_use') md += `### Tool: ${c.name}\n\n\`\`\`json\n${JSON.stringify(c.input, null, 2).slice(0, 1000)}\n\`\`\`\n\n`;
                else if (c.type === 'thinking') md += `<details><summary>Thinking</summary>\n\n${(c.thinking || '').slice(0, 500)}\n\n</details>\n\n`;
              }
            }
            if (obj.message.usage) {
              md += `*Tokens: in=${obj.message.usage.input_tokens || 0}, out=${obj.message.usage.output_tokens || 0}*\n\n`;
            }
            md += '---\n\n';
          }
        } catch (_) {}
      }

      const filename = `conversation-${sessionId.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.md`;
      res.writeHead(200, {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`
      });
      res.end(md);
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // ==================== EXPORT API ====================

  if (req.url === '/api/export' && req.method === 'GET') {
    try {
      const bundle = {};
      for (const [key, fp] of [['claude.json', CLAUDE_JSON_PATH], ['settings.json', SETTINGS_JSON_PATH], ['settings.local.json', SETTINGS_LOCAL_PATH]]) {
        try { bundle[key] = JSON.parse(fs.readFileSync(fp, 'utf8')); } catch (_) {}
      }
      try { bundle['keybindings.json'] = JSON.parse(fs.readFileSync(KEYBINDINGS_PATH, 'utf8')); } catch (_) {}
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="claude-config-export.json"'
      });
      res.end(JSON.stringify(bundle, null, 2));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

// Spawn an MCP server, send initialize + tools/list, return tool names
function fetchMcpTools(config) {
  return new Promise((resolve, reject) => {
    const timeout = 15000; // 15s max per server
    let done = false;
    let buffer = '';
    let msgId = 1;
    let initialized = false;

    const env = { ...process.env, ...(config.env || {}) };
    let stderrOutput = '';

    const child = spawn(config.command, config.args || [], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env,
      shell: true
    });

    const timer = setTimeout(() => {
      if (!done) { done = true; child.kill(); reject(new Error('Timeout (' + timeout/1000 + 's) — stderr: ' + stderrOutput.slice(0, 200))); }
    }, timeout);

    child.stdout.on('data', (chunk) => {
      buffer += chunk.toString();
      // MCP uses newline-delimited JSON-RPC
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep incomplete line

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const msg = JSON.parse(trimmed);
          if (msg.id === 1 && !initialized) {
            // Got initialize response, now request tools/list
            initialized = true;
            // Send initialized notification
            child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
            // Request tools list
            msgId++;
            child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: msgId, method: 'tools/list', params: {} }) + '\n');
          } else if (msg.id === 2 && msg.result) {
            // Got tools list
            done = true;
            clearTimeout(timer);
            const tools = (msg.result.tools || []).map(t => ({
              name: t.name,
              description: t.description || '',
              schemaSize: JSON.stringify(t.inputSchema || {}).length
            }));
            child.kill();
            resolve({ tools, stderr: stderrOutput });
          }
        } catch (_) {} // skip non-JSON lines
      }
    });

    child.stderr.on('data', (chunk) => { stderrOutput += chunk.toString().slice(0, 5000); });

    child.on('error', (err) => {
      if (!done) { done = true; clearTimeout(timer); reject(err); }
    });

    child.on('close', () => {
      if (!done) { done = true; clearTimeout(timer); reject(new Error('Server exited before responding')); }
    });

    // Send initialize request
    const initMsg = {
      jsonrpc: '2.0',
      id: msgId,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'mcp-manager', version: '1.0.0' }
      }
    };
    child.stdin.write(JSON.stringify(initMsg) + '\n');
  });
}

// When required by Electron, export the server instead of auto-listening
if (require.main === module) {
  server.listen(PORT, '127.0.0.1', () => {
    console.log(`\n  MCP Server Manager running at:\n`);
    console.log(`  → http://localhost:${PORT}\n`);
    console.log(`  Config: ${CLAUDE_JSON_PATH}`);
    console.log(`  Press Ctrl+C to stop\n`);
  });
}

module.exports = { server, PORT };
