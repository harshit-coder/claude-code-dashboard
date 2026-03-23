// Claude Code Dashboard — File Watcher
// Watches ~/.claude/ for config changes and notifies renderer
const fs = require('fs');
const path = require('path');

const HOME = process.env.USERPROFILE || process.env.HOME;
const CLAUDE_DIR = path.join(HOME, '.claude');
const CLAUDE_JSON = path.join(HOME, '.claude.json');

function setupFileWatcher(ipcMain, mainWindow) {
  const debounceMs = 300;
  const timers = new Map();

  function notifyChange(filePath) {
    // Debounce per file
    if (timers.has(filePath)) clearTimeout(timers.get(filePath));
    timers.set(filePath, setTimeout(() => {
      timers.delete(filePath);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('config:changed', filePath);
      }
    }, debounceMs));
  }

  // Watch ~/.claude.json
  try {
    fs.watch(CLAUDE_JSON, (eventType) => {
      if (eventType === 'change') notifyChange(CLAUDE_JSON);
    });
  } catch (e) {
    // File might not exist yet
  }

  // Watch key files in ~/.claude/
  const watchFiles = [
    'settings.json',
    'settings.local.json',
    'keybindings.json',
  ];

  for (const file of watchFiles) {
    const fullPath = path.join(CLAUDE_DIR, file);
    try {
      fs.watch(fullPath, (eventType) => {
        if (eventType === 'change') notifyChange(fullPath);
      });
    } catch (e) {
      // File might not exist yet
    }
  }

  // Watch projects directory recursively
  const projectsDir = path.join(CLAUDE_DIR, 'projects');
  try {
    fs.watch(projectsDir, { recursive: true }, (eventType, filename) => {
      if (filename) {
        notifyChange(path.join(projectsDir, filename));
      }
    });
  } catch (e) {
    // Directory might not exist
  }
}

module.exports = { setupFileWatcher };
