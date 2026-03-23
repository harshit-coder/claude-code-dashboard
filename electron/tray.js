// Claude Code Dashboard — System Tray Manager
const { Tray, Menu, nativeImage } = require('electron');
const path = require('path');

function setupTray(mainWindow, app) {
  const iconPath = path.join(__dirname, '..', 'assets', 'icon.png');

  let trayIcon;
  try {
    trayIcon = nativeImage.createFromPath(iconPath);
    // Resize for tray (16x16 on Windows)
    trayIcon = trayIcon.resize({ width: 16, height: 16 });
  } catch (e) {
    // Fallback: create a simple colored icon
    trayIcon = createFallbackIcon();
  }

  const tray = new Tray(trayIcon);
  tray.setToolTip('Claude Code Dashboard');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Dashboard',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    {
      label: 'Terminal',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.executeJavaScript(
            `window.location.href = '/terminal'`
          );
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Health Check',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.executeJavaScript(
            `window.location.href = '/health'`
          );
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Auto-start with Windows',
      type: 'checkbox',
      checked: app.getLoginItemSettings().openAtLogin,
      click: (menuItem) => {
        app.setLoginItemSettings({
          openAtLogin: menuItem.checked,
          path: app.getPath('exe'),
          args: menuItem.checked ? ['--hidden'] : [],
        });
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  // Click tray icon to show/hide window
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });

  return tray;
}

function createFallbackIcon() {
  // Create a 16x16 purple icon as fallback
  const { nativeImage } = require('electron');
  const size = 16;
  const canvas = Buffer.alloc(size * size * 4);

  for (let i = 0; i < size * size; i++) {
    const x = i % size;
    const y = Math.floor(i / size);
    const offset = i * 4;

    // Purple circle on transparent background
    const cx = size / 2, cy = size / 2, r = size / 2 - 1;
    const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);

    if (dist <= r) {
      canvas[offset] = 0x6c;     // R
      canvas[offset + 1] = 0x5c; // G
      canvas[offset + 2] = 0xe7; // B
      canvas[offset + 3] = 0xff; // A
    } else {
      canvas[offset + 3] = 0x00; // transparent
    }
  }

  return nativeImage.createFromBuffer(canvas, { width: size, height: size });
}

module.exports = { setupTray };
