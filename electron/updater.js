// Claude Code Dashboard — Auto Updater
// Uses electron-updater for automatic update checking and installation

let autoUpdater = null;

function setupUpdater(app, mainWindow) {
  try {
    autoUpdater = require('electron-updater').autoUpdater;
  } catch (e) {
    console.log('[Updater] electron-updater not installed — auto-updates disabled');
    return;
  }

  const { Notification } = require('electron');

  // Configure
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  // Events
  autoUpdater.on('checking-for-update', () => {
    console.log('[Updater] Checking for updates...');
  });

  autoUpdater.on('update-available', (info) => {
    console.log('[Updater] Update available:', info.version);
    if (Notification.isSupported()) {
      const n = new Notification({
        title: 'Update Available',
        body: `Claude Code Dashboard v${info.version} is downloading...`,
      });
      n.show();
    }
  });

  autoUpdater.on('update-not-available', () => {
    console.log('[Updater] No updates available');
  });

  autoUpdater.on('download-progress', (progress) => {
    console.log(`[Updater] Download: ${Math.round(progress.percent)}%`);
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('[Updater] Update downloaded:', info.version);
    if (Notification.isSupported()) {
      const n = new Notification({
        title: 'Update Ready',
        body: `v${info.version} will be installed on next restart.`,
      });
      n.on('click', () => {
        autoUpdater.quitAndInstall();
      });
      n.show();
    }
  });

  autoUpdater.on('error', (err) => {
    console.error('[Updater] Error:', err.message);
  });

  // Check after 10 second delay
  setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify().catch(() => {});
  }, 10000);
}

function checkForUpdates() {
  if (autoUpdater) {
    autoUpdater.checkForUpdatesAndNotify().catch(() => {});
  }
}

module.exports = { setupUpdater, checkForUpdates };
