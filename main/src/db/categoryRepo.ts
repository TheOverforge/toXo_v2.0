import type Database from 'better-sqlite3';

export interface Category {
  id: number;
  name: string;
  color: string;
  sort_order: number;
  created_at: string;
  task_count: number;
}

const CATEGORY_COLS = 'id, name, color, sort_order, created_at';

function rowToCategory(r: any): Category {
  return {
    id:         r.id,
    name:       r.name,
    color:      r.color,
    sort_order: r.sort_order,
    created_at: r.created_at,
    task_count: 0,
  };
}

export class CategoryRepo {
  constructor(private db: Database.Database) {}

  private nowIso(): string {
    return new Date().toISOString().replace(/\.\d{3}Z$/, '+00:00');
  }

  listCategories(): Category[] {
    const rows = this.db.prepare(`SELECT ${CATEGORY_COLS} FROM categories ORDER BY sort_order`).all() as any[];
    const cats = rows.map(rowToCategory);
    const countStmt = this.db.prepare('SELECT COUNT(*) FROM tasks WHERE category_id = ?').raw();
    for (const cat of cats) {
      cat.task_count = ((countStmt.get(cat.id) as any)[0]) as number;
    }
    return cats;
  }

  getCategory(categoryId: number): Category | null {
    const row = this.db.prepare(`SELECT ${CATEGORY_COLS} FROM categories WHERE id=?`).get(categoryId) as any;
    if (!row) return null;
    const cat = rowToCategory(row);
    cat.task_count = ((this.db.prepare('SELECT COUNT(*) FROM tasks WHERE category_id = ?').raw().get(categoryId) as any)[0]) as number;
    return cat;
  }

  addCategory(name: string, color: string): number {
    name = name.trim();
    if (!name) throw new Error('Category name cannot be empty');
    const maxOrder = ((this.db.prepare('SELECT COALESCE(MAX(sort_order), -1) FROM categories').raw().get() as any)[0]) as number;
    const result = this.db.prepare(
      'INSERT INTO categories(name, color, sort_order, created_at) VALUES (?, ?, ?, ?)'
    ).run(name, color, maxOrder + 1, this.nowIso());
    return result.lastInsertRowid as number;
  }

  updateCategory(categoryId: number, name: string, color: string): void {
    name = name.trim();
    if (!name) throw new Error('Category name cannot be empty');
    this.db.prepare('UPDATE categories SET name=?, color=? WHERE id=?').run(name, color, categoryId);
  }

  deleteCategory(categoryId: number): void {
    this.db.prepare('UPDATE tasks SET category_id = NULL WHERE category_id = ?').run(categoryId);
    this.db.prepare('DELETE FROM categories WHERE id=?').run(categoryId);
  }

  reorderCategories(categoryIds: number[]): void {
    const stmt = this.db.prepare('UPDATE categories SET sort_order=? WHERE id=?');
    const reorder = this.db.transaction((ids: number[]) => {
      ids.forEach((id, i) => stmt.run(i, id));
    });
    reorder(categoryIds);
  }

  setTaskCategory(taskId: number, categoryId: number | null): void {
    this.db.prepare('UPDATE tasks SET category_id=?, updated_at=? WHERE id=?')
      .run(categoryId, this.nowIso(), taskId);
  }
}
