import { app, BrowserWindow, ipcMain } from 'electron';
import { enforceSingleInstance } from './singleInstance';
import { createMainWindow, setTitlebarTheme } from './windowManager';
import { createTray } from './tray';
import { startNotificationScheduler } from './notificationScheduler';
import { AppDatabase } from './db/database';
import { registerAllHandlers } from './ipc/index';
import { initDefaultLanguage } from './ipc/settings.ipc';
import path from 'path';
import fs from 'fs';

app.setName('toXo');
if (process.platform === 'win32') {
  app.setAppUserModelId('toXo');
}

process.on('uncaughtException', (err) => {
  console.error('[CRASH] uncaughtException:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[CRASH] unhandledRejection:', reason);
});

// ── Single instance guard (temporarily disabled for testing) ──────────────────
// enforceSingleInstance();

// ── App lifecycle ─────────────────────────────────────────────────────────────
let db: AppDatabase;
let mainWindow: BrowserWindow | null = null;

function readTheme(): string {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    const data = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    return (data.theme as string) || 'dark';
  } catch {
    return 'dark';
  }
}

app.whenReady().then(() => {
  console.log('[BOOT] app ready');
db = new AppDatabase();
  console.log('[BOOT] db created');
  registerAllHandlers(db);
  initDefaultLanguage();

  ipcMain.on('titlebar:setTheme', (_evt, theme: string) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      setTitlebarTheme(mainWindow, theme);
    }
  });

  // Window controls — used by custom React titlebar buttons
  ipcMain.handle('window:minimize',    () => mainWindow?.minimize());
  ipcMain.handle('window:maximize',    () => {
    if (!mainWindow) return;
    mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
  });
  ipcMain.handle('window:close',       () => mainWindow?.close());
  ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized() ?? false);

  const theme = readTheme();
  console.log('[BOOT] creating window, theme:', theme);
  mainWindow = createMainWindow(theme);

  mainWindow.on('maximize',   () => mainWindow!.webContents.send('window:maximized', true));
  mainWindow.on('unmaximize', () => mainWindow!.webContents.send('window:maximized', false));
  console.log('[BOOT] window created');
  createTray(mainWindow);
  startNotificationScheduler(db, mainWindow);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow(readTheme());
    }
  });
});

app.on('window-all-closed', () => {
  console.log('[EVENT] window-all-closed, platform:', process.platform);
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  console.log('[EVENT] before-quit');
  db?.close();
});
