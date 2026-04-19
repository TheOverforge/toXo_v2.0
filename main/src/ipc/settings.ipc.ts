import { ipcMain, app, dialog } from 'electron';
import path from 'path';
import fs from 'fs';

function getSettingsPath(): string {
  return path.join(app.getPath('userData'), 'settings.json');
}

function loadSettings(): Record<string, unknown> {
  try {
    return JSON.parse(fs.readFileSync(getSettingsPath(), 'utf-8'));
  } catch {
    return {};
  }
}

function saveSettings(data: Record<string, unknown>): void {
  const p = getSettingsPath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf-8');
}

function getSystemLanguage(): string {
  const locale = app.getLocale(); // e.g. "ru-RU", "en-US"
  return locale.toLowerCase().startsWith('ru') ? 'ru' : 'en';
}

export function initDefaultLanguage(): void {
  const s = loadSettings();
  if (!('language' in s)) {
    s.language = getSystemLanguage();
    saveSettings(s);
  }
}

export function registerSettingsHandlers(): void {
  ipcMain.handle('settings:get', (_, key: string, def: unknown) => {
    const s = loadSettings();
    return key in s ? s[key] : def;
  });

  ipcMain.handle('settings:set', (_, key: string, value: unknown) => {
    const s = loadSettings();
    s[key] = value;
    saveSettings(s);
  });

  ipcMain.handle('settings:getAll', () => loadSettings());

  ipcMain.handle('shell:showSaveDialog', async (_, opts: Electron.SaveDialogOptions) => {
    return dialog.showSaveDialog(opts);
  });

  ipcMain.handle('shell:showOpenDialog', async (_, opts: Electron.OpenDialogOptions) => {
    return dialog.showOpenDialog(opts);
  });
}
