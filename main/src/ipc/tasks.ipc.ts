import { ipcMain, dialog } from 'electron';
import type { AppDatabase } from '../db/database.js';
import fs from 'fs';
import { DEMO_TASKS, getWelcomeTask, getDemoCategories, getFinanceDemoData, getLang } from '../demoData.js';

export function registerTaskHandlers(db: AppDatabase): void {
  ipcMain.handle('tasks:list',    () => db.tasks.listTasks());
  ipcMain.handle('tasks:get',     (_, id: number) => db.tasks.getTask(id));
  ipcMain.handle('tasks:create',  (_, data: { title?: string; description?: string; categoryId?: number }) =>
    db.tasks.addTask(data.title ?? '', data.description ?? '', data.categoryId ?? null));
  ipcMain.handle('tasks:update',  (_, id: number, data: { title: string; description: string }) =>
    db.tasks.updateTask(id, data.title, data.description));
  ipcMain.handle('tasks:updateFields', (_, id: number, fields: any) =>
    db.tasks.updateTaskFields(id, fields));
  ipcMain.handle('tasks:delete',       (_, id: number)             => db.tasks.deleteTask(id));
  ipcMain.handle('tasks:setDone',      (_, id: number, done: boolean)          => db.tasks.setDone(id, done));
  ipcMain.handle('tasks:setPriority',  (_, id: number, priority: number)       => db.tasks.setPriority(id, priority));
  ipcMain.handle('tasks:setPinned',    (_, id: number, pinned: boolean)        => db.tasks.setPinned(id, pinned));
  ipcMain.handle('tasks:setRecurrence',(_, id: number, rec: string | null)     => db.tasks.setRecurrence(id, rec));
  ipcMain.handle('tasks:setReminder',  (_, id: number, iso: string | null)     => db.tasks.setReminder(id, iso));
  ipcMain.handle('tasks:setDeadline',  (_, id: number, iso: string | null)     => db.tasks.setDeadline(id, iso));
  ipcMain.handle('tasks:setCategory',  (_, id: number, catId: number | null)   => db.tasks.setCategory(id, catId));
  ipcMain.handle('tasks:setTags',      (_, id: number, tags: string)           => db.tasks.setTags(id, tags));
  ipcMain.handle('tasks:reorder',      (_, ids: number[])                      => db.tasks.reorderTasks(ids));
  ipcMain.handle('tasks:archive',      (_, id: number, flag: boolean)          => db.tasks.archiveTask(id, flag));
  ipcMain.handle('tasks:archiveCompleted', (_, olderThan: string) => db.tasks.archiveCompletedTasks(olderThan));
  ipcMain.handle('tasks:clearArchive', () => db.tasks.clearArchive());
  ipcMain.handle('tasks:duplicate',    (_, id: number) => db.tasks.duplicateTask(id));
  ipcMain.handle('tasks:restore',      (_, snap: any) => db.tasks.addTaskFull(snap));
  ipcMain.handle('tasks:getByDeadlineDate', (_, dateStr: string) => db.tasks.getTasksWithDeadlineOn(dateStr));
  ipcMain.handle('tasks:logEvent',     (_, id: number, type: string) => db.tasks.logEvent(id, type));
  ipcMain.handle('tasks:ensureWelcomeTask', () => {
    const welcome = getWelcomeTask();
    const all = db.tasks.listTasks();
    const existing = all.find((t: any) =>
      t.is_pinned && (t.title.startsWith('👋') || t.title.toLowerCase().includes('toxo'))
    );
    if (existing) {
      // Refresh text if language changed
      if (existing.title !== welcome.title) {
        db.tasks.updateTask(existing.id, welcome.title, welcome.description ?? '');
        const subs = db.tasks.listSubtasks(existing.id);
        for (const s of subs) db.tasks.deleteSubtask(s.id);
        for (const sub of welcome.subtasks) db.tasks.addSubtask(existing.id, sub);
      }
      return existing.id;
    }
    // Not found — create it now
    const id = db.tasks.addTaskFull({
      title:       welcome.title,
      description: welcome.description,
      priority:    0,
      is_pinned:   true,
      created_at:  new Date().toISOString().replace(/\.\d{3}Z$/, '+00:00'),
    });
    for (const sub of welcome.subtasks) {
      db.tasks.addSubtask(id, sub);
    }
    return id;
  });

  // ── Subtasks ────────────────────────────────────────────────────────────
  ipcMain.handle('subtasks:list',   (_, taskId: number)                        => db.tasks.listSubtasks(taskId));
  ipcMain.handle('subtasks:add',    (_, taskId: number, title: string)         => db.tasks.addSubtask(taskId, title));
  ipcMain.handle('subtasks:setDone',(_, id: number, done: boolean)             => db.tasks.setSubtaskDone(id, done));
  ipcMain.handle('subtasks:rename', (_, id: number, title: string)             => db.tasks.updateSubtaskTitle(id, title));
  ipcMain.handle('subtasks:delete', (_, id: number)                            => db.tasks.deleteSubtask(id));
  ipcMain.handle('subtasks:reorder',(_, _taskId: number, ids: number[])        => db.tasks.reorderSubtasks(ids));
  ipcMain.handle('subtasks:counts', () => db.tasks.subtaskCountsAll());

  // ── Export / Import ─────────────────────────────────────────────────────
  ipcMain.handle('tasks:exportJson', async (_, filePath: string) => {
    const tasks = db.tasks.listTasks();
    fs.writeFileSync(filePath, JSON.stringify(tasks, null, 2), 'utf-8');
  });

  ipcMain.handle('tasks:exportCsv', async (_, filePath: string) => {
    const tasks = db.tasks.listTasks();
    const header = 'id,title,description,is_done,created_at,completed_at,priority,category_id,tags,deadline_at,is_archived\n';
    const rows = tasks.map(t =>
      [t.id, `"${t.title.replace(/"/g,'""')}"`, `"${(t.description||'').replace(/"/g,'""')}"`,
       t.is_done?1:0, t.created_at, t.completed_at||'', t.priority, t.category_id??'', t.tags, t.deadline_at||'', t.is_archived?1:0
      ].join(',')
    ).join('\n');
    fs.writeFileSync(filePath, header + rows, 'utf-8');
  });

  ipcMain.handle('tasks:clearAll', () => {
    db.db.prepare('DELETE FROM subtasks').run();
    db.db.prepare('DELETE FROM tasks').run();
    db.db.prepare('DELETE FROM categories').run();
    db.db.prepare('DELETE FROM fin_transactions').run();
    db.db.prepare('DELETE FROM fin_budgets').run();
    db.db.prepare('DELETE FROM fin_goals').run();
    db.db.prepare('DELETE FROM fin_accounts').run();
    db.db.prepare('DELETE FROM fin_categories').run();
  });

  ipcMain.handle('tasks:importJson', async (_, filePath: string) => {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    let count = 0;
    for (const t of data) {
      db.tasks.addTaskFull(t);
      count++;
    }
    return count;
  });

  ipcMain.handle('tasks:loadDemo', () => {
    const now = new Date();
    const iso = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, '+00:00');
    const daysAgo    = (n: number) => { const d = new Date(now); d.setDate(d.getDate() - n); return iso(d); };
    const daysAhead  = (n: number) => { const d = new Date(now); d.setDate(d.getDate() + n); return iso(d); };

    const lang = getLang();
    const isEn = lang === 'en';

    // ── Task categories (bilingual) ──────────────────────────────────────────
    const cats = getDemoCategories();
    const catWork     = db.categories.addCategory(cats.work,     '#0a84ff');
    const catPersonal = db.categories.addCategory(cats.personal, '#30d158');
    const catLearn    = db.categories.addCategory(cats.learning, '#bf5af2');
    const catHealth   = db.categories.addCategory(cats.health,   '#ff453a');
    const catFinance  = db.categories.addCategory(cats.finance,  '#ffd60a');

    const catMap: Record<string, number> = {
      work: catWork, personal: catPersonal, learning: catLearn,
      health: catHealth, finance: catFinance,
    };

    // ── Pinned welcome task first ────────────────────────────────────────────
    const welcome = getWelcomeTask();
    const welcomeId = db.tasks.addTaskFull({
      title:       welcome.title,
      description: welcome.description,
      priority:    0,
      is_pinned:   true,
      created_at:  iso(now),
    });
    for (const sub of welcome.subtasks) {
      db.tasks.addSubtask(welcomeId, sub);
    }

    // ── Finance demo data (bilingual) ────────────────────────────────────────
    const dateStr = (n: number) => { const d = new Date(now); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
    const fin = getFinanceDemoData();

    const accIds = fin.accounts.map(a => db.finance.addAccount(a.name, a.type, a.balance, a.currency, a.color).id);
    const catIds = fin.categories.map(c => db.finance.addFinCategory(c.name, c.type, c.color, c.icon).id);

    for (const tx of fin.transactions) {
      const catId = tx.catIdx >= 0 ? catIds[tx.catIdx] : null;
      const accId = accIds[tx.accIdx];
      const currency = isEn ? 'USD' : 'RUB';
      db.finance.addTransaction(tx.type as 'income'|'expense', tx.amount, currency, catId, accId, dateStr(tx.daysBack), tx.title, '', '', 0, null);
    }

    for (let i = 0; i < fin.budgets.length; i++) {
      db.finance.addBudget(catIds[fin.budgets[i]], fin.budgetLimits[i], 'monthly');
    }

    for (const g of fin.goals) {
      const deadline = g.daysAhead != null ? dateStr(-g.daysAhead) : null;
      db.finance.addGoal(g.name, g.target, g.current, g.currency, g.color, deadline);
    }

    // ── Seed all demo tasks (bilingual titles) ───────────────────────────────
    for (const t of DEMO_TASKS) {
      db.tasks.addTaskFull({
        title:        (isEn && t.titleEn) ? t.titleEn : t.title,
        description:  t.description ?? '',
        priority:     t.priority    ?? 0,
        category_id:  t.cat ? catMap[t.cat] : null,
        is_done:      !!t.is_done,
        is_pinned:    !!t.is_pinned,
        is_archived:  !!t.is_archived,
        tags:         t.tags        ?? '',
        recurrence:   t.recurrence  ?? null,
        created_at:   daysAgo(t.daysAgo    ?? 0),
        completed_at: t.is_done     ? daysAgo((t.daysAgo ?? 0) > 0 ? Math.floor((t.daysAgo ?? 1) / 2) : 0) : null,
        deadline_at:  t.deadlineAhead != null ? daysAhead(t.deadlineAhead) : null,
      });
    }
  });
}
