import type Database from 'better-sqlite3';

export interface Task {
  id: number;
  title: string;
  description: string;
  is_done: boolean;
  created_at: string;
  completed_at: string | null;
  updated_at: string | null;
  priority: number;
  category_id: number | null;
  remind_at: string | null;
  remind_shown: boolean;
  deadline_at: string | null;
  deadline_notified: number;
  is_pinned: boolean;
  recurrence: string | null;
  tags: string;
  sort_order: number;
  is_archived: boolean;
}

export interface Subtask {
  id: number;
  task_id: number;
  title: string;
  is_done: boolean;
  sort_order: number;
}

const TASK_COLS = 'id, title, description, is_done, created_at, completed_at, updated_at, priority, category_id, remind_at, remind_shown, deadline_at, deadline_notified, is_pinned, recurrence, tags, sort_order, is_archived';

function rowToTask(r: any): Task {
  return {
    id:                r.id,
    title:             r.title,
    description:       r.description,
    is_done:           Boolean(r.is_done),
    created_at:        r.created_at,
    completed_at:      r.completed_at ?? null,
    updated_at:        r.updated_at ?? null,
    priority:          r.priority || 0,
    category_id:       r.category_id ?? null,
    remind_at:         r.remind_at ?? null,
    remind_shown:      Boolean(r.remind_shown),
    deadline_at:       r.deadline_at ?? null,
    deadline_notified: r.deadline_notified || 0,
    is_pinned:         Boolean(r.is_pinned),
    recurrence:        r.recurrence ?? null,
    tags:              r.tags || '',
    sort_order:        r.sort_order || 0,
    is_archived:       Boolean(r.is_archived),
  };
}

export class TaskRepo {
  constructor(private db: Database.Database) {}

  private nowIso(): string {
    return new Date().toISOString().replace(/\.\d{3}Z$/, '+00:00');
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────

  listTasks(): Task[] {
    const rows = this.db.prepare(`SELECT ${TASK_COLS} FROM tasks`).all();
    return rows.map(rowToTask);
  }

  getTask(taskId: number): Task | null {
    const row = this.db.prepare(`SELECT ${TASK_COLS} FROM tasks WHERE id=?`).get(taskId);
    return row ? rowToTask(row) : null;
  }

  addTask(title: string, description: string, categoryId: number | null = null): number {
    const now = this.nowIso();
    const maxOrder = (this.db.prepare('SELECT COALESCE(MAX(sort_order), 0) FROM tasks').raw().get() as any)[0] as number;
    const result = this.db.prepare(
      'INSERT INTO tasks(title, description, is_done, created_at, updated_at, priority, category_id, sort_order) VALUES (?, ?, 0, ?, ?, 0, ?, ?)'
    ).run(title.trim(), description.trim(), now, now, categoryId, maxOrder + 1);
    return result.lastInsertRowid as number;
  }

  addTaskFull(snap: Partial<Task>): number {
    const now = this.nowIso();
    const result = this.db.prepare(
      'INSERT INTO tasks(title, description, is_done, created_at, completed_at, updated_at, priority, category_id, remind_at, remind_shown, deadline_at, deadline_notified, is_pinned, recurrence, tags, sort_order, is_archived) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
    ).run(
      snap.title || '',
      snap.description || '',
      snap.is_done ? 1 : 0,
      snap.created_at || now,
      snap.completed_at ?? null,
      now,
      snap.priority || 0,
      snap.category_id ?? null,
      snap.remind_at ?? null,
      snap.remind_shown ? 1 : 0,
      snap.deadline_at ?? null,
      snap.deadline_notified || 0,
      snap.is_pinned ? 1 : 0,
      snap.recurrence ?? null,
      snap.tags || '',
      snap.sort_order || 0,
      snap.is_archived ? 1 : 0,
    );
    return result.lastInsertRowid as number;
  }

  updateTask(taskId: number, title: string, description: string): void {
    this.db.prepare('UPDATE tasks SET title=?, description=?, updated_at=? WHERE id=?')
      .run(title.trim(), description.trim(), this.nowIso(), taskId);
  }

  updateTaskFields(taskId: number, fields: Partial<Task>): void {
    const allowed: (keyof Task)[] = ['title', 'description', 'priority', 'category_id',
      'remind_at', 'remind_shown', 'deadline_at', 'deadline_notified', 'is_pinned',
      'recurrence', 'tags', 'sort_order', 'is_archived', 'is_done', 'completed_at'];
    const entries = Object.entries(fields).filter(([k]) => allowed.includes(k as keyof Task));
    if (entries.length === 0) return;
    entries.push(['updated_at', this.nowIso()]);
    const sets = entries.map(([k]) => `${k}=?`).join(', ');
    const vals = entries.map(([, v]) => typeof v === 'boolean' ? (v ? 1 : 0) : v);
    this.db.prepare(`UPDATE tasks SET ${sets} WHERE id=?`).run(...vals, taskId);
  }

  deleteTask(taskId: number): void {
    this.db.prepare('DELETE FROM subtasks WHERE task_id=?').run(taskId);
    this.db.prepare('DELETE FROM tasks WHERE id=?').run(taskId);
  }

  // ── done / priority / pin / recurrence ────────────────────────────────────

  setDone(taskId: number, isDone: boolean): void {
    const now = this.nowIso();
    if (isDone) {
      this.db.prepare('UPDATE tasks SET is_done=1, completed_at=?, updated_at=? WHERE id=?')
        .run(now, now, taskId);
    } else {
      this.db.prepare('UPDATE tasks SET is_done=0, completed_at=NULL, updated_at=? WHERE id=?')
        .run(now, taskId);
    }
  }

  setPriority(taskId: number, priority: number): void {
    this.db.prepare('UPDATE tasks SET priority=?, updated_at=? WHERE id=?')
      .run(priority, this.nowIso(), taskId);
  }

  setPinned(taskId: number, isPinned: boolean): void {
    this.db.prepare('UPDATE tasks SET is_pinned=?, updated_at=? WHERE id=?')
      .run(isPinned ? 1 : 0, this.nowIso(), taskId);
  }

  setRecurrence(taskId: number, recurrence: string | null): void {
    this.db.prepare('UPDATE tasks SET recurrence=?, updated_at=? WHERE id=?')
      .run(recurrence, this.nowIso(), taskId);
  }

  setTags(taskId: number, tags: string): void {
    this.db.prepare('UPDATE tasks SET tags=? WHERE id=?').run(tags.trim(), taskId);
  }

  setCategory(taskId: number, categoryId: number | null): void {
    this.db.prepare('UPDATE tasks SET category_id=?, updated_at=? WHERE id=?')
      .run(categoryId, this.nowIso(), taskId);
  }

  // ── reminders ─────────────────────────────────────────────────────────────

  setReminder(taskId: number, remindAt: string | null): void {
    this.db.prepare('UPDATE tasks SET remind_at=?, remind_shown=0, updated_at=? WHERE id=?')
      .run(remindAt, this.nowIso(), taskId);
  }

  markReminderShown(taskId: number): void {
    this.db.prepare('UPDATE tasks SET remind_shown=1 WHERE id=?').run(taskId);
  }

  getDueReminders(): Task[] {
    const now = this.nowIso();
    return (this.db.prepare(
      `SELECT ${TASK_COLS} FROM tasks WHERE remind_at IS NOT NULL AND remind_shown=0 AND remind_at <= ?`
    ).all(now) as any[]).map(rowToTask);
  }

  // ── deadlines ─────────────────────────────────────────────────────────────

  setDeadline(taskId: number, deadlineAt: string | null): void {
    this.db.prepare('UPDATE tasks SET deadline_at=?, deadline_notified=0, updated_at=? WHERE id=?')
      .run(deadlineAt, this.nowIso(), taskId);
  }

  markDeadlineNotified(taskId: number, level: number): void {
    this.db.prepare('UPDATE tasks SET deadline_notified=? WHERE id=?').run(level, taskId);
  }

  getTasksWithDeadlineOn(dateStr: string): Task[] {
    return (this.db.prepare(
      `SELECT ${TASK_COLS} FROM tasks WHERE is_archived=0 AND deadline_at IS NOT NULL AND DATE(deadline_at, 'localtime') = ? ORDER BY deadline_at`
    ).all(dateStr) as any[]).map(rowToTask);
  }

  getTasksDueOnOrBefore(dateStr: string): Task[] {
    return (this.db.prepare(
      `SELECT ${TASK_COLS} FROM tasks WHERE is_archived=0 AND is_done=0 AND deadline_at IS NOT NULL AND DATE(deadline_at, 'localtime') <= ? AND deadline_notified < 2`
    ).all(dateStr) as any[]).map(rowToTask);
  }

  // ── archive ───────────────────────────────────────────────────────────────

  archiveTask(taskId: number, archived: boolean): void {
    this.db.prepare('UPDATE tasks SET is_archived=?, updated_at=? WHERE id=?')
      .run(archived ? 1 : 0, this.nowIso(), taskId);
  }

  archiveCompletedTasks(olderThan: string): number {
    const result = this.db.prepare(
      "UPDATE tasks SET is_archived=1, updated_at=? WHERE is_done=1 AND is_archived=0 AND completed_at IS NOT NULL AND completed_at <= ?"
    ).run(this.nowIso(), olderThan);
    return result.changes;
  }

  clearArchive(): number {
    this.db.prepare('DELETE FROM subtasks WHERE task_id IN (SELECT id FROM tasks WHERE is_archived=1)').run();
    const result = this.db.prepare('DELETE FROM tasks WHERE is_archived=1').run();
    return result.changes;
  }

  // ── ordering ──────────────────────────────────────────────────────────────

  reorderTasks(idOrder: number[]): void {
    const stmt = this.db.prepare('UPDATE tasks SET sort_order=? WHERE id=?');
    const reorder = this.db.transaction((ids: number[]) => {
      ids.forEach((id, pos) => stmt.run(pos, id));
    });
    reorder(idOrder);
  }

  // ── duplicate ─────────────────────────────────────────────────────────────

  duplicateTask(taskId: number): number | null {
    const task = this.getTask(taskId);
    if (!task) return null;
    const now = this.nowIso();
    const maxOrder = (this.db.prepare('SELECT COALESCE(MAX(sort_order), 0) FROM tasks').raw().get() as any)[0] as number;
    const result = this.db.prepare(
      'INSERT INTO tasks(title, description, is_done, created_at, updated_at, priority, category_id, tags, sort_order, is_archived, recurrence) VALUES (?,?,0,?,?,?,?,?,?,0,?)'
    ).run(
      `${task.title} (копия)`,
      task.description,
      now, now,
      task.priority,
      task.category_id,
      task.tags,
      maxOrder + 1,
      task.recurrence,
    );
    return result.lastInsertRowid as number;
  }

  // ── event log ─────────────────────────────────────────────────────────────

  logEvent(taskId: number, eventType: string): void {
    this.db.prepare('INSERT INTO task_events(task_id, event_type, ts) VALUES (?, ?, ?)')
      .run(taskId, eventType, this.nowIso());
  }

  // ── subtasks ──────────────────────────────────────────────────────────────

  addSubtask(taskId: number, title: string): number {
    const now = this.nowIso();
    const maxOrder = (this.db.prepare('SELECT COALESCE(MAX(sort_order), -1) FROM subtasks WHERE task_id=?').raw().get(taskId) as any)[0] as number;
    const result = this.db.prepare(
      'INSERT INTO subtasks(task_id, title, is_done, sort_order, created_at) VALUES (?,?,0,?,?)'
    ).run(taskId, title.trim(), maxOrder + 1, now);
    return result.lastInsertRowid as number;
  }

  listSubtasks(taskId: number): Subtask[] {
    return (this.db.prepare(
      'SELECT id, task_id, title, is_done, sort_order FROM subtasks WHERE task_id=? ORDER BY sort_order'
    ).all(taskId) as any[]).map((r: any) => ({
      id: r.id, task_id: r.task_id, title: r.title, is_done: Boolean(r.is_done), sort_order: r.sort_order,
    }));
  }

  setSubtaskDone(subtaskId: number, isDone: boolean): void {
    this.db.prepare('UPDATE subtasks SET is_done=? WHERE id=?').run(isDone ? 1 : 0, subtaskId);
  }

  updateSubtaskTitle(subtaskId: number, title: string): void {
    this.db.prepare('UPDATE subtasks SET title=? WHERE id=?').run(title.trim(), subtaskId);
  }

  deleteSubtask(subtaskId: number): void {
    this.db.prepare('DELETE FROM subtasks WHERE id=?').run(subtaskId);
  }

  reorderSubtasks(idOrder: number[]): void {
    const stmt = this.db.prepare('UPDATE subtasks SET sort_order=? WHERE id=?');
    const reorder = this.db.transaction((ids: number[]) => {
      ids.forEach((id, pos) => stmt.run(pos, id));
    });
    reorder(idOrder);
  }

  subtaskCountsAll(): Record<number, [number, number]> {
    const rows = this.db.prepare(
      'SELECT task_id, SUM(CASE WHEN is_done THEN 1 ELSE 0 END) AS done_cnt, COUNT(*) AS total FROM subtasks GROUP BY task_id'
    ).all() as any[];
    const result: Record<number, [number, number]> = {};
    for (const r of rows) {
      result[r.task_id as number] = [r.done_cnt as number, r.total as number];
    }
    return result;
  }
}
