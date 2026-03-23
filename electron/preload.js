// Claude Code Dashboard — Electron Preload Script
// Exposes safe IPC bridge to renderer pages via window.electronAPI
const { contextBridge, ipcRenderer } = require('electron');

console.log('[Preload] Loading electronAPI bridge...');

contextBridge.exposeInMainWorld('electronAPI', {
  // ── Identity ─────────────────────────────────────────────────────
  isElectron: true,
  platform: process.platform,

  // ── App ──────────────────────────────────────────────────────────
  getPort: () => ipcRenderer.invoke('app:getPort'),
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  navigate: (route) => ipcRenderer.invoke('app:navigate', route),

  // ── App Control ─────────────────────────────────────────────────
  restart: () => ipcRenderer.invoke('app:restart'),
  stopServer: () => ipcRenderer.invoke('app:stopServer'),
  startServer: () => ipcRenderer.invoke('app:startServer'),
  toggleDevTools: () => ipcRenderer.invoke('app:toggleDevTools'),
  reloadPage: () => ipcRenderer.invoke('app:reloadPage'),
  quit: () => ipcRenderer.invoke('app:quit'),

  // ── Auto-start ───────────────────────────────────────────────────
  setAutoStart: (enabled) => ipcRenderer.invoke('app:setAutoStart', enabled),
  getAutoStart: () => ipcRenderer.invoke('app:getAutoStart'),

  // ── Updates ─────────────────────────────────────────────────────
  checkForUpdates: () => ipcRenderer.invoke('app:checkForUpdates'),

  // ── Terminal ─────────────────────────────────────────────────────
  createTerminal: (opts) => ipcRenderer.invoke('terminal:create', opts),
  writeTerminal: (id, data) => ipcRenderer.send('terminal:write', id, data),
  resizeTerminal: (id, cols, rows) => ipcRenderer.send('terminal:resize', id, cols, rows),
  closeTerminal: (id) => ipcRenderer.send('terminal:close', id),
  runInTerminal: (cmd, cwd) => ipcRenderer.invoke('terminal:run', cmd, cwd),
  listTerminals: () => ipcRenderer.invoke('terminal:list'),

  // Terminal events (renderer listens)
  onTerminalData: (callback) => {
    const handler = (_, id, data) => callback(id, data);
    ipcRenderer.on('terminal:data', handler);
    return () => ipcRenderer.removeListener('terminal:data', handler);
  },
  onTerminalExit: (callback) => {
    const handler = (_, id, code) => callback(id, code);
    ipcRenderer.on('terminal:exit', handler);
    return () => ipcRenderer.removeListener('terminal:exit', handler);
  },

  // ── File Watcher ─────────────────────────────────────────────────
  onConfigChange: (callback) => {
    const handler = (_, filePath) => callback(filePath);
    ipcRenderer.on('config:changed', handler);
    return () => ipcRenderer.removeListener('config:changed', handler);
  },

  // ── Notifications ────────────────────────────────────────────────
  notify: (title, body) => ipcRenderer.send('notify', title, body),

  // ── MCP Server Control ───────────────────────────────────────────
  mcpStart: (name, config) => ipcRenderer.invoke('mcp:start', name, config),
  mcpStop: (name) => ipcRenderer.invoke('mcp:stop', name),
  mcpRestart: (name, config) => ipcRenderer.invoke('mcp:restart', name, config),
  mcpRunning: () => ipcRenderer.invoke('mcp:running'),

  // ── Agent Runner ─────────────────────────────────────────────────
  agentQueue: (prompt, cwd) => ipcRenderer.invoke('agent:queue', prompt, cwd),
  agentCancel: (id) => ipcRenderer.invoke('agent:cancel', id),
  agentList: () => ipcRenderer.invoke('agent:list'),
  agentOutput: (id) => ipcRenderer.invoke('agent:output', id),
  onAgentUpdate: (callback) => {
    const handler = (_, data) => callback(data);
    ipcRenderer.on('agent:update', handler);
    return () => ipcRenderer.removeListener('agent:update', handler);
  },
});
