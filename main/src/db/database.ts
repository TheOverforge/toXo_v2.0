import BetterSqlite3 from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { runMigrations } from './migrations';
import { TaskRepo } from './taskRepo';
import { CategoryRepo } from './categoryRepo';
import { AnalyticsRepo } from './analyticsRepo';
import { FinanceRepo } from './financeRepo';

export function getDbPath(): string {
  const appData = process.env.APPDATA;
  const base = appData ? path.join(appData, 'todo_app') : path.join(os.homedir(), '.todo_app');
  return path.join(base, 'tasks.sqlite');
}

export class AppDatabase {
  readonly db: BetterSqlite3.Database;
  readonly tasks: TaskRepo;
  readonly categories: CategoryRepo;
  readonly analytics: AnalyticsRepo;
  readonly finance: FinanceRepo;

  constructor(dbPath?: string) {
    const filePath = dbPath ?? getDbPath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });

    this.db = new BetterSqlite3(filePath, { timeout: 10_000 });
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');

    runMigrations(this.db);

    this.tasks      = new TaskRepo(this.db);
    this.categories = new CategoryRepo(this.db);
    this.analytics  = new AnalyticsRepo(this.db);
    this.finance    = new FinanceRepo(this.db);
  }

  close(): void {
    this.db.close();
  }
}
