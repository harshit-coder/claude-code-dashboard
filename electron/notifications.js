// Claude Code Dashboard — Native Notifications Manager
const { Notification } = require('electron');

function setupNotifications(ipcMain) {
  // Simple notification from renderer
  ipcMain.on('notify', (_, title, body) => {
    if (Notification.isSupported()) {
      const notification = new Notification({
        title: title || 'Claude Code Dashboard',
        body: body || '',
        icon: undefined, // will use app icon
      });
      notification.show();
    }
  });

  // Notification with click action (navigates to a page)
  ipcMain.handle('notify:action', (event, { title, body, route }) => {
    if (Notification.isSupported()) {
      const notification = new Notification({
        title: title || 'Claude Code Dashboard',
        body: body || '',
      });

      notification.on('click', () => {
        const win = event.sender.getOwnerBrowserWindow?.();
        if (win) {
          win.show();
          win.focus();
          if (route) {
            win.webContents.executeJavaScript(
              `window.location.href = '${route}'`
            );
          }
        }
      });

      notification.show();
    }
  });
}

// Utility for main process to send notifications
function sendNotification(title, body) {
  if (Notification.isSupported()) {
    new Notification({ title, body }).show();
  }
}

module.exports = { setupNotifications, sendNotification };
