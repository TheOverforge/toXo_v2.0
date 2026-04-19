import type { AppDatabase } from '../db/database';
import { registerTaskHandlers } from './tasks.ipc';
import { registerCategoryHandlers } from './categories.ipc';
import { registerAnalyticsHandlers } from './analytics.ipc';
import { registerFinanceHandlers } from './finance.ipc';
import { registerSettingsHandlers } from './settings.ipc';

export function registerAllHandlers(db: AppDatabase): void {
  registerTaskHandlers(db);
  registerCategoryHandlers(db);
  registerAnalyticsHandlers(db);
  registerFinanceHandlers(db);
  registerSettingsHandlers();
}
