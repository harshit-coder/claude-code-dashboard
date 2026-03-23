// Claude Code Dashboard — Electron Main Process
const { app, BrowserWindow, Menu, ipcMain, nativeImage } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const { setupTray } = require('./tray');
const { setupTerminalManager } = require('./terminal-manager');
const { setupFileWatcher } = require('./file-watcher');
const { setupNotifications } = require('./notifications');
const { setupAgentRunner } = require('./agent-runner');
const { setupUpdater, checkForUpdates } = require('./updater');

// ── Globals ──────────────────────────────────────────────────────────
let mainWindow = null;
let serverProcess = null;
let tray = null;
let serverPort = 3456;

// ── Ensure server is always cleaned up on exit ──────────────────────
process.on('exit', () => { killServer(); });
process.on('SIGTERM', () => { killServer(); app.quit(); });
process.on('SIGINT', () => { killServer(); app.quit(); });
process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]', err);
  killServer();
});
process.on('unhandledRejection', (err) => {
  console.error('[Unhandled Rejection]', err);
  killServer();
});

// ── Server Management ────────────────────────────────────────────────
function startServer() {
  return new Promise((resolve, reject) => {
    const serverScript = path.join(__dirname, '..', 'mcp-manager-server.js');

    // Use environment variable to pass port; server defaults to 3456
    const env = { ...process.env, ELECTRON_MODE: '1' };

    // Use 'node' from PATH, not process.execPath (which is Electron's binary)
    const nodeCmd = process.platform === 'win32' ? 'node.exe' : 'node';

    serverProcess = spawn(nodeCmd, [serverScript], {
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: path.join(__dirname, '..'),
      shell: false,
    });

    // Prevent EPIPE crashes on broken pipes during shutdown
    serverProcess.stdin.on('error', () => {});
    serverProcess.stdout.on('error', () => {});
    serverProcess.stderr.on('error', () => {});

    let started = false;
    let outputBuffer = '';

    serverProcess.stdout.on('data', (data) => {
      const msg = data.toString();
      outputBuffer += msg;
      console.log('[Server]', msg.trim());
      if (!started && (outputBuffer.includes('running at') || outputBuffer.includes('localhost:'))) {
        started = true;
        const match = outputBuffer.match(/localhost:(\d+)/);
        if (match) serverPort = parseInt(match[1], 10);
        resolve(serverPort);
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error('[Server Error]', data.toString());
    });

    serverProcess.on('error', (err) => {
      console.error('[Server Spawn Error]', err);
      if (!started) reject(err);
    });

    serverProcess.on('exit', (code) => {
      console.log(`[Server] exited with code ${code}`);
      if (!started) reject(new Error(`Server exited with code ${code}`));
    });

    // Timeout fallback — if server doesn't print ready message in 5s
    setTimeout(() => {
      if (!started) {
        started = true;
        console.log('[Electron] Server timeout — proceeding with default port', serverPort);
        resolve(serverPort);
      }
    }, 5000);
  });
}

function killServer() {
  if (serverProcess && !serverProcess.killed) {
    // Detach pipe listeners before killing to prevent EPIPE errors
    serverProcess.stdout.removeAllListeners('data');
    serverProcess.stderr.removeAllListeners('data');
    serverProcess.stdin.end();
    try {
      serverProcess.kill('SIGTERM');
    } catch (_) {
      // Ignore errors if process already exited
    }
    serverProcess = null;
  }
}

// ── Window Creation ──────────────────────────────────────────────────
function createMainWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'Claude Code Dashboard',
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
    backgroundColor: '#0f1117',
    show: false, // show when ready to avoid flash
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // needed for preload to use require
    },
  });

  // Hide menu bar
  mainWindow.setMenuBarVisibility(false);
  Menu.setApplicationMenu(null);

  // Load the dashboard
  mainWindow.loadURL(`http://127.0.0.1:${port}`);

  // Open DevTools in dev mode
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  // Show when ready
  mainWindow.once('ready-to-show', () => {
    // Start minimized if --hidden flag passed
    if (process.argv.includes('--hidden')) {
      // Don't show, just tray
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  // Minimize to tray instead of closing
  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

// ── App Lifecycle ────────────────────────────────────────────────────
app.whenReady().then(async () => {
  try {
    console.log('[Electron] Starting internal server...');
    const port = await startServer();
    console.log(`[Electron] Server ready on port ${port}`);

    const win = createMainWindow(port);

    // Setup system tray
    tray = setupTray(win, app);

    // Setup terminal manager (IPC handlers for node-pty)
    setupTerminalManager(ipcMain, win);

    // Setup file watcher for live config updates
    setupFileWatcher(ipcMain, win);

    // Setup native notifications
    setupNotifications(ipcMain);

    // Setup background agent runner
    setupAgentRunner(ipcMain, win);

    // Setup auto-updater
    setupUpdater(app, win);

    // IPC: check for updates manually
    ipcMain.handle('app:checkForUpdates', () => {
      checkForUpdates();
      return { status: 'checking' };
    });

    // IPC: get server port
    ipcMain.handle('app:getPort', () => serverPort);

    // IPC: get app version
    ipcMain.handle('app:getVersion', () => app.getVersion());

    // IPC: navigate to page
    ipcMain.handle('app:navigate', (_, route) => {
      if (mainWindow) {
        mainWindow.loadURL(`http://127.0.0.1:${serverPort}${route}`);
      }
    });

    // IPC: toggle auto-start
    ipcMain.handle('app:setAutoStart', (_, enabled) => {
      app.setLoginItemSettings({
        openAtLogin: enabled,
        path: app.getPath('exe'),
        args: enabled ? ['--hidden'] : [],
      });
      return app.getLoginItemSettings().openAtLogin;
    });

    ipcMain.handle('app:getAutoStart', () => {
      return app.getLoginItemSettings().openAtLogin;
    });

    // ── App Control ─────────────────────────────────────────────────
    ipcMain.handle('app:restart', () => {
      // Relaunch the entire app cleanly
      app.isQuitting = true;
      killServer();
      app.relaunch();
      setTimeout(() => app.quit(), 200);
      return { status: 'restarting' };
    });

    ipcMain.handle('app:stopServer', () => {
      killServer();
      return { status: 'stopped' };
    });

    ipcMain.handle('app:startServer', async () => {
      if (serverProcess && !serverProcess.killed) {
        return { status: 'already_running', port: serverPort };
      }
      const port = await startServer();
      serverPort = port;
      return { status: 'started', port };
    });

    ipcMain.handle('app:toggleDevTools', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.toggleDevTools();
      }
      return { toggled: true };
    });

    ipcMain.handle('app:reloadPage', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.reload();
      }
      return { reloaded: true };
    });

    ipcMain.handle('app:quit', () => {
      app.isQuitting = true;
      killServer();
      setTimeout(() => app.quit(), 200);
    });

    // ── MCP Server Control ──────────────────────────────────────────
    const mcpProcesses = new Map(); // name → child_process

    ipcMain.handle('mcp:start', (_, name, config) => {
      if (mcpProcesses.has(name)) return { error: `${name} is already running` };
      if (!config || !config.command) return { error: 'No command specified' };

      try {
        const args = config.args || [];
        const env = { ...process.env, ...(config.env || {}) };
        const proc = spawn(config.command, args, { env, stdio: 'pipe', shell: true });

        proc.on('exit', (code) => {
          mcpProcesses.delete(name);
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('mcp:status', { name, status: 'stopped', code });
          }
        });

        proc.on('error', (err) => {
          mcpProcesses.delete(name);
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('mcp:status', { name, status: 'error', error: err.message });
          }
        });

        mcpProcesses.set(name, proc);
        return { status: 'started', name };
      } catch (err) {
        return { error: err.message };
      }
    });

    ipcMain.handle('mcp:stop', (_, name) => {
      const proc = mcpProcesses.get(name);
      if (!proc) return { error: `${name} is not running` };
      proc.kill();
      mcpProcesses.delete(name);
      return { status: 'stopped', name };
    });

    ipcMain.handle('mcp:restart', async (_, name, config) => {
      const proc = mcpProcesses.get(name);
      if (proc) { proc.kill(); mcpProcesses.delete(name); }
      // Small delay before restarting
      await new Promise(r => setTimeout(r, 500));
      return ipcMain.emit('mcp:start', null, name, config);
    });

    ipcMain.handle('mcp:running', () => {
      return Array.from(mcpProcesses.keys());
    });

  } catch (err) {
    console.error('[Electron] Failed to start:', err);
    killServer();
    app.quit();
  }
});

// macOS: re-create window on dock click
app.on('activate', () => {
  if (mainWindow) {
    mainWindow.show();
  }
});

// Kill server early when requested (e.g. from tray Quit)
app.on('kill-server', () => {
  killServer();
});

// Quit properly
app.on('before-quit', () => {
  app.isQuitting = true;
  killServer();
});

app.on('window-all-closed', () => {
  // On macOS, apps stay active until Cmd+Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}
