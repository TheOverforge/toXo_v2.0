import { Tray, Menu, app, BrowserWindow } from 'electron';
import path from 'path';

let tray: Tray | null = null;

export function createTray(win: BrowserWindow): void {
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'shared/assets/images/app_icon.ico')
    : path.join(__dirname, '../../../shared/assets/images/app_icon.ico');

  try {
    tray = new Tray(iconPath);
  } catch {
    // Icon not found during dev — skip tray
    return;
  }

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Открыть toXo',
      click: () => {
        if (win.isMinimized()) win.restore();
        win.show();
        win.focus();
      },
    },
    {
      label: 'Новая задача',
      click: () => {
        win.show();
        win.webContents.send('tray:newTask');
      },
    },
    { type: 'separator' },
    { label: 'Выход', click: () => app.quit() },
  ]);

  tray.setToolTip('toXo');
  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
  });
}
