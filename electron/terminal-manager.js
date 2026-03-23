// Claude Code Dashboard — Terminal Manager (node-pty)
// Manages multiple PTY terminal instances via IPC
const path = require('path');

let pty = null;
try {
  pty = require('node-pty');
} catch (e) {
  console.warn('[Terminal] node-pty not available — terminal features will use fallback. Install VS Build Tools and run: npm install node-pty');
}

const terminals = new Map(); // id → { pty, cwd, title }
let nextId = 1;

function getDefaultShell() {
  if (process.platform === 'win32') {
    // Prefer PowerShell, fall back to cmd.exe with full paths
    const sysRoot = process.env.SystemRoot || 'C:\\WINDOWS';
    const ps = path.join(sysRoot, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
    const cmd = path.join(sysRoot, 'System32', 'cmd.exe');
    const fs = require('fs');
    if (fs.existsSync(ps)) return ps;
    if (fs.existsSync(cmd)) return cmd;
    return process.env.COMSPEC || 'cmd.exe';
  }
  return process.env.SHELL || '/bin/bash';
}

function setupTerminalManager(ipcMain, mainWindow) {
  // Create a new terminal
  ipcMain.handle('terminal:create', (_, opts = {}) => {
    if (!pty) return { error: 'node-pty not installed. Run: npm install node-pty' };

    const id = nextId++;
    const shell = opts.shell || getDefaultShell();
    const fs = require('fs');
    let cwd = opts.cwd || process.env.USERPROFILE || process.env.HOME;
    // Validate cwd exists, fall back to home if not
    try { if (!fs.existsSync(cwd)) cwd = process.env.USERPROFILE || process.env.HOME; } catch (e) { cwd = process.env.USERPROFILE || process.env.HOME; }
    const cols = opts.cols || 120;
    const rows = opts.rows || 30;

    try {
      const term = pty.spawn(shell, [], {
        name: 'xterm-256color',
        cols,
        rows,
        cwd,
        env: { ...process.env },
      });

      term.onData((data) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('terminal:data', id, data);
        }
      });

      term.onExit(({ exitCode }) => {
        terminals.delete(id);
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('terminal:exit', id, exitCode);
        }
      });

      terminals.set(id, { pty: term, cwd, title: opts.title || `Terminal ${id}` });
      return { id, title: terminals.get(id).title };
    } catch (err) {
      return { error: err.message };
    }
  });

  // Write data to terminal stdin
  ipcMain.on('terminal:write', (_, id, data) => {
    const t = terminals.get(id);
    if (t) t.pty.write(data);
  });

  // Resize terminal
  ipcMain.on('terminal:resize', (_, id, cols, rows) => {
    const t = terminals.get(id);
    if (t) {
      try { t.pty.resize(cols, rows); } catch (e) { /* ignore resize errors */ }
    }
  });

  // Close terminal
  ipcMain.on('terminal:close', (_, id) => {
    const t = terminals.get(id);
    if (t) {
      t.pty.kill();
      terminals.delete(id);
    }
  });

  // Run a command in a new terminal (opens terminal + types command)
  ipcMain.handle('terminal:run', (_, cmd, cwd) => {
    if (!pty) return { error: 'node-pty not installed' };

    const id = nextId++;
    const shell = getDefaultShell();
    const termCwd = cwd || process.env.USERPROFILE || process.env.HOME;

    try {
      const term = pty.spawn(shell, [], {
        name: 'xterm-256color',
        cols: 120,
        rows: 30,
        cwd: termCwd,
        env: { ...process.env },
      });

      term.onData((data) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('terminal:data', id, data);
        }
      });

      term.onExit(({ exitCode }) => {
        terminals.delete(id);
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('terminal:exit', id, exitCode);
        }
      });

      terminals.set(id, { pty: term, cwd: termCwd, title: cmd.substring(0, 40) });

      // Send the command after a short delay to let shell initialize
      setTimeout(() => {
        term.write(cmd + '\r');
      }, 500);

      return { id, title: terminals.get(id).title };
    } catch (err) {
      return { error: err.message };
    }
  });

  // List active terminals
  ipcMain.handle('terminal:list', () => {
    const list = [];
    for (const [id, t] of terminals) {
      list.push({ id, cwd: t.cwd, title: t.title });
    }
    return list;
  });
}

// Cleanup all terminals
function cleanupTerminals() {
  for (const [id, t] of terminals) {
    try { t.pty.kill(); } catch (e) { /* ignore */ }
  }
  terminals.clear();
}

module.exports = { setupTerminalManager, cleanupTerminals };
