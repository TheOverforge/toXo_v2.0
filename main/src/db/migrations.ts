import type Database from 'better-sqlite3';

export function runMigrations(db: Database.Database): void {
  // Ensure base tasks table exists (handles very old DBs)
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      is_done INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    )
  `);

  // Add description column for extremely old DBs
  const cols = (db.pragma('table_info(tasks)') as any[]).map((r: any) => r.name as string);
  if (!cols.includes('description')) {
    db.exec("ALTER TABLE tasks ADD COLUMN description TEXT NOT NULL DEFAULT ''");
  }

  const version = db.pragma('user_version', { simple: true }) as number;
  const isFresh = version === 0;

  if (version < 1)  migrateV1(db);
  if (version < 2)  migrateV2(db);
  if (version < 3)  migrateV3(db);
  if (version < 4)  migrateV4(db);
  if (version < 5)  migrateV5(db);
  if (version < 6)  migrateV6(db);
  if (version < 7)  migrateV7(db);
  if (version < 8)  migrateV8(db);
  if (version < 9)  migrateV9(db);
  if (version < 10) migrateV10(db);
  if (version < 11) {
    if (!isFresh) migrateV11(db);
    else { db.pragma('user_version = 11'); }
  }
  if (version < 12) {
    if (!isFresh) migrateV12(db);
    else { db.pragma('user_version = 12'); }
  }
  if (version < 13) migrateV13(db);
}

// ── v0→v1: add completed_at, updated_at, priority; create task_events ────────
function migrateV1(db: Database.Database): void {
  const cols = (db.pragma('table_info(tasks)') as any[]).map((r: any) => r.name as string);
  if (!cols.includes('completed_at'))
    db.exec('ALTER TABLE tasks ADD COLUMN completed_at TEXT');
  if (!cols.includes('updated_at'))
    db.exec('ALTER TABLE tasks ADD COLUMN updated_at TEXT');
  if (!cols.includes('priority'))
    db.exec('ALTER TABLE tasks ADD COLUMN priority INTEGER NOT NULL DEFAULT 0');

  db.exec(`
    UPDATE tasks SET completed_at = created_at WHERE is_done = 1 AND completed_at IS NULL;
    CREATE TABLE IF NOT EXISTS task_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      event_type TEXT NOT NULL,
      ts TEXT NOT NULL
    );
  `);

  const cnt = (db.prepare('SELECT COUNT(*) FROM task_events').get() as any)[0] as number;
  if (cnt === 0) {
    db.exec(`
      INSERT INTO task_events(task_id, event_type, ts)
        SELECT id, 'CREATED', created_at FROM tasks;
      INSERT INTO task_events(task_id, event_type, ts)
        SELECT id, 'COMPLETED', completed_at FROM tasks
        WHERE is_done = 1 AND completed_at IS NOT NULL;
    `);
  }
  db.pragma('user_version = 1');
}

// ── v1→v2: create categories table; add category_id to tasks ─────────────────
function migrateV2(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(name)
    );
    CREATE INDEX IF NOT EXISTS idx_categories_sort ON categories(sort_order);
  `);
  const cols = (db.pragma('table_info(tasks)') as any[]).map((r: any) => r.name as string);
  if (!cols.includes('category_id'))
    db.exec('ALTER TABLE tasks ADD COLUMN category_id INTEGER DEFAULT NULL');
  db.exec('CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category_id)');
  db.pragma('user_version = 2');
}

// ── v2→v3: add remind_at and remind_shown to tasks ────────────────────────────
function migrateV3(db: Database.Database): void {
  const cols = (db.pragma('table_info(tasks)') as any[]).map((r: any) => r.name as string);
  if (!cols.includes('remind_at'))
    db.exec('ALTER TABLE tasks ADD COLUMN remind_at TEXT DEFAULT NULL');
  if (!cols.includes('remind_shown'))
    db.exec('ALTER TABLE tasks ADD COLUMN remind_shown INTEGER NOT NULL DEFAULT 0');
  db.exec('CREATE INDEX IF NOT EXISTS idx_tasks_remind ON tasks(remind_at, remind_shown)');
  db.pragma('user_version = 3');
}

// ── v3→v4: add deadline_at and deadline_notified to tasks ─────────────────────
function migrateV4(db: Database.Database): void {
  const cols = (db.pragma('table_info(tasks)') as any[]).map((r: any) => r.name as string);
  if (!cols.includes('deadline_at'))
    db.exec('ALTER TABLE tasks ADD COLUMN deadline_at TEXT DEFAULT NULL');
  if (!cols.includes('deadline_notified'))
    db.exec('ALTER TABLE tasks ADD COLUMN deadline_notified INTEGER NOT NULL DEFAULT 0');
  db.exec('CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline_at, deadline_notified)');
  db.pragma('user_version = 4');
}

// ── v4→v5: add is_pinned and recurrence to tasks ──────────────────────────────
function migrateV5(db: Database.Database): void {
  const cols = (db.pragma('table_info(tasks)') as any[]).map((r: any) => r.name as string);
  if (!cols.includes('is_pinned'))
    db.exec('ALTER TABLE tasks ADD COLUMN is_pinned INTEGER NOT NULL DEFAULT 0');
  if (!cols.includes('recurrence'))
    db.exec('ALTER TABLE tasks ADD COLUMN recurrence TEXT DEFAULT NULL');
  db.exec('CREATE INDEX IF NOT EXISTS idx_tasks_pinned ON tasks(is_pinned)');
  db.pragma('user_version = 5');
}

// ── v5→v6: create subtasks table ─────────────────────────────────────────────
function migrateV6(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS subtasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      is_done INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_subtasks_task ON subtasks(task_id, sort_order);
  `);
  db.pragma('user_version = 6');
}

// ── v6→v7: add tags and sort_order to tasks ───────────────────────────────────
function migrateV7(db: Database.Database): void {
  const cols = (db.pragma('table_info(tasks)') as any[]).map((r: any) => r.name as string);
  if (!cols.includes('tags'))
    db.exec("ALTER TABLE tasks ADD COLUMN tags TEXT NOT NULL DEFAULT ''");
  if (!cols.includes('sort_order')) {
    db.exec('ALTER TABLE tasks ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0');
    db.exec('UPDATE tasks SET sort_order = id');
  }
  db.pragma('user_version = 7');
}

// ── v7→v8: add is_archived flag to tasks ──────────────────────────────────────
function migrateV8(db: Database.Database): void {
  const cols = (db.pragma('table_info(tasks)') as any[]).map((r: any) => r.name as string);
  if (!cols.includes('is_archived'))
    db.exec('ALTER TABLE tasks ADD COLUMN is_archived INTEGER NOT NULL DEFAULT 0');
  db.exec('CREATE INDEX IF NOT EXISTS idx_tasks_archived ON tasks(is_archived)');
  db.pragma('user_version = 8');
}

// ── v8→v9: create finance tables ──────────────────────────────────────────────
function migrateV9(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS fin_accounts (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      type       TEXT NOT NULL DEFAULT 'bank',
      balance    REAL NOT NULL DEFAULT 0.0,
      currency   TEXT NOT NULL DEFAULT '₽',
      color      TEXT NOT NULL DEFAULT '#0a84ff',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS fin_categories (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      type       TEXT NOT NULL DEFAULT 'expense',
      color      TEXT NOT NULL DEFAULT '#0a84ff',
      icon       TEXT NOT NULL DEFAULT '●',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS fin_transactions (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      type           TEXT NOT NULL DEFAULT 'expense',
      amount         REAL NOT NULL DEFAULT 0.0,
      currency       TEXT NOT NULL DEFAULT '₽',
      category_id    INTEGER,
      account_id     INTEGER,
      date           TEXT NOT NULL,
      title          TEXT NOT NULL DEFAULT '',
      note           TEXT NOT NULL DEFAULT '',
      tags           TEXT NOT NULL DEFAULT '',
      is_recurring   INTEGER NOT NULL DEFAULT 0,
      recurring_rule TEXT,
      created_at     TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS fin_budgets (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id  INTEGER NOT NULL,
      limit_amount REAL NOT NULL DEFAULT 0.0,
      period       TEXT NOT NULL DEFAULT 'month',
      created_at   TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS fin_goals (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      name           TEXT NOT NULL,
      target_amount  REAL NOT NULL DEFAULT 0.0,
      current_amount REAL NOT NULL DEFAULT 0.0,
      deadline       TEXT,
      color          TEXT NOT NULL DEFAULT '#bf5af2',
      currency       TEXT NOT NULL DEFAULT '₽',
      created_at     TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_fin_tx_date ON fin_transactions(date);
    CREATE INDEX IF NOT EXISTS idx_fin_tx_type ON fin_transactions(type);
    CREATE INDEX IF NOT EXISTS idx_fin_tx_cat  ON fin_transactions(category_id);
    CREATE INDEX IF NOT EXISTS idx_fin_tx_acc  ON fin_transactions(account_id);
  `);
  db.pragma('user_version = 9');
}

// ── v9→v10: refresh finance mock data ────────────────────────────────────────
function migrateV10(db: Database.Database): void {
  for (const tbl of ['fin_transactions', 'fin_budgets', 'fin_goals', 'fin_accounts', 'fin_categories']) {
    db.prepare(`DELETE FROM ${tbl}`).run();
  }
  db.pragma('user_version = 10');
}

// ── v10→v11: seed 90-day task history for analytics demo ──────────────────────
function migrateV11(db: Database.Database): void {
  // Non-destructive: just bump version (seeding handled by TypeScript seed functions)
  db.pragma('user_version = 11');
}

// ── v11→v12: seed calendar tasks with deadlines ───────────────────────────────
function migrateV12(db: Database.Database): void {
  db.pragma('user_version = 12');
}

// ── v12→v13: add to_account_id to fin_transactions (transfers) ───────────────
function migrateV13(db: Database.Database): void {
  const cols = (db.pragma('table_info(fin_transactions)') as any[]).map((r: any) => r.name as string);
  if (!cols.includes('to_account_id')) {
    db.exec('ALTER TABLE fin_transactions ADD COLUMN to_account_id INTEGER REFERENCES fin_accounts(id) ON DELETE SET NULL');
  }
  db.pragma('user_version = 13');
}
