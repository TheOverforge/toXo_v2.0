import { Notification, BrowserWindow, app } from 'electron';
import path from 'path';
import fs from 'fs';
import type { AppDatabase } from './db/database';

const POLL_INTERVAL = 30_000; // 30 seconds

function getIconPath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'shared/assets/images/app_icon.ico');
  }
  // dev: __dirname = main/dist, go up 2 levels to project root
  return path.join(__dirname, '../../renderer/public/app_icon.png');
}

function isToday(isoStr: string | null): boolean {
  if (!isoStr) return false;
  return isoStr.slice(0, 10) === new Date().toISOString().slice(0, 10);
}

function readSetting<T>(key: string, defaultValue: T): T {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    const data = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    return key in data ? (data[key] as T) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function fmtTime(iso: string | null, lang: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const day = d.getDate();
  const months_ru = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
  const months_en = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const mon = lang === 'ru' ? months_ru[d.getMonth()] : months_en[d.getMonth()];
  return `${day} ${mon}, ${hh}:${mm}`;
}

export function startNotificationScheduler(db: AppDatabase, win: BrowserWindow): void {
  setInterval(() => {
    if (!readSetting('notifications_enabled', true)) return;

    const iconPath = getIconPath();
    const icon = iconPath ? { icon: iconPath } : {};
    const lang = readSetting<string>('language', 'ru');
    const isRu = lang === 'ru';

    // ── Reminders ────────────────────────────────────────────────────────
    try {
      const dueReminders = db.tasks.getDueReminders();
      for (const task of dueReminders) {
        const timeStr = fmtTime(task.remind_at, lang);
        new Notification({
          title: task.title || '…',
          body: isRu
            ? `⏰ Напоминание${timeStr ? ` · ${timeStr}` : ''}`
            : `⏰ Reminder${timeStr ? ` · ${timeStr}` : ''}`,
          ...icon,
        }).show();
        db.tasks.markReminderShown(task.id);
        if (!win.isDestroyed()) win.webContents.send('notification:reminderFired', task.id);
      }
    } catch { /* ignore */ }

    // ── Deadline warnings ─────────────────────────────────────────────────
    try {
      const today = new Date().toISOString().slice(0, 10);
      const dueTasks = db.tasks.getTasksDueOnOrBefore(today);
      for (const task of dueTasks) {
        const level = isToday(task.deadline_at) ? 1 : 2;
        if (task.deadline_notified < level) {
          const timeStr = fmtTime(task.deadline_at, lang);
          const body = level === 1
            ? (isRu ? `📅 Дедлайн сегодня${timeStr ? ` · ${timeStr}` : ''}` : `📅 Deadline today${timeStr ? ` · ${timeStr}` : ''}`)
            : (isRu ? `⚠️ Просрочено${timeStr ? ` · ${timeStr}` : ''}` : `⚠️ Overdue${timeStr ? ` · ${timeStr}` : ''}`);
          new Notification({
            title: task.title || '…',
            body,
            ...icon,
          }).show();
          db.tasks.markDeadlineNotified(task.id, level);
          if (!win.isDestroyed()) win.webContents.send('notification:deadlineFired', task.id, level);
        }
      }
    } catch { /* ignore */ }
  }, POLL_INTERVAL);
}
