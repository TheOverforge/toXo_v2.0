import { ipcMain } from 'electron';
import type { AppDatabase } from '../db/database.js';

export function registerAnalyticsHandlers(db: AppDatabase): void {
  ipcMain.handle('analytics:getKpi',               (_, since: string, until?: string) => db.analytics.getKpi(since, until));
  ipcMain.handle('analytics:completedPerDay',      (_, since: string, until?: string) => db.analytics.getCompletedPerDay(since, until));
  ipcMain.handle('analytics:createdVsCompleted',   (_, since: string, until?: string) => db.analytics.getCreatedVsCompleted(since, until));
  ipcMain.handle('analytics:statusDistribution',   (_, since: string, until?: string) => db.analytics.getStatusDistribution(since, until));
  ipcMain.handle('analytics:completedByWeekday',   (_, since: string, until?: string) => db.analytics.getCompletedByWeekday(since, until));
  ipcMain.handle('analytics:completedByCategory',  (_, since: string, until?: string) => db.analytics.getCompletedByCategory(since, until));
  ipcMain.handle('analytics:priorityDistribution', (_, since: string, until?: string) => db.analytics.getPriorityDistribution(since, until));
}
