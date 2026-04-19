import { app, BrowserWindow } from 'electron';
import path from 'path';

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForRendererFirstFrame(win: BrowserWindow): Promise<void> {
  try {
    // Wait for 2 rAFs inside the renderer so React/Vite/CSS have actually
    // produced a real first frame before we do anything with the native window.
    await win.webContents.executeJavaScript(
      `new Promise(resolve => {
         requestAnimationFrame(() => requestAnimationFrame(() => resolve(true)));
       })`,
      true
    );
  } catch {
    // Can fire early during hot-reload; not fatal — just continue.
  }
}

async function primeAcrylicBeforeReveal(win: BrowserWindow): Promise<void> {
  if (win.isDestroyed()) return;

  const bounds = win.getBounds();

  // 1) Wait until renderer has actually painted a frame.
  await waitForRendererFirstFrame(win);
  if (win.isDestroyed()) return;

  // 2) Show the window completely invisible so the user never sees the
  //    grey/black initial frame that Electron 31.x produces.
  win.setOpacity(0);
  win.show();

  // One tick for the native window to exist in DWM.
  await wait(16);
  if (win.isDestroyed()) return;

  // 3) Re-apply acrylic now that the HWND is live.
  win.setBackgroundMaterial('acrylic');

  // 4) Force a full Chromium repaint.
  win.webContents.invalidate();

  // 5) Trigger the resize nudge that is the actual workaround for the
  //    Electron 31.x bug: backgroundMaterial requires a repaint/resize on
  //    initial creation before it activates for frameless windows.
  win.setBounds({ ...bounds, width: bounds.width + 1 }, false);
  win.setBounds(bounds, false);

  await wait(16);
  if (win.isDestroyed()) return;

  // 6) Reveal the window — by now the acrylic repaint has been triggered.
  win.setOpacity(1);
  win.focus();
}

export function createMainWindow(theme = 'dark'): BrowserWindow {
  void theme;

  const preloadPath = path.join(__dirname, '../../preload/dist/preload.js');

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    transparent: true,
    backgroundMaterial: 'acrylic',
    titleBarStyle: 'hidden',
    autoHideMenuBar: true,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  win.once('ready-to-show', () => {
    void primeAcrylicBeforeReveal(win);
  });

  win.on('unmaximize', () => {
    if (!win.isDestroyed()) {
      win.setBackgroundMaterial('acrylic');
      win.webContents.invalidate();
    }
  });
  win.on('restore', () => {
    if (!win.isDestroyed()) {
      win.setBackgroundMaterial('acrylic');
      win.webContents.invalidate();
    }
  });

  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, '../../renderer/dist/index.html'));
  } else {
    win.loadURL('http://127.0.0.1:5173');
  }

  return win;
}

export function setTitlebarTheme(_win: BrowserWindow, _theme: string): void {}
