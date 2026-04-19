import type Database from 'better-sqlite3';

export interface FinAccount {
  id: number; name: string; type: string;
  balance: number; currency: string; color: string; created_at: string;
}
export interface FinCategory {
  id: number; name: string; type: string;
  color: string; icon: string; created_at: string;
}
export interface Transaction {
  id: number; type: string; amount: number; currency: string;
  category_id: number | null; account_id: number | null;
  to_account_id: number | null;
  date: string; title: string; note: string; tags: string;
  is_recurring: number; recurring_rule: string | null; created_at: string;
  // virtual (enriched)
  category_name: string; category_color: string; category_icon: string;
  account_name: string; account_color: string;
  to_account_name: string; to_account_color: string;
}
export interface Budget {
  id: number; category_id: number; limit_amount: number; period: string; created_at: string;
  category_name: string; category_color: string; category_icon: string; spent: number;
}
export interface Goal {
  id: number; name: string; target_amount: number; current_amount: number;
  deadline: string | null; color: string; currency: string; created_at: string;
}

const ACCOUNT_COLS  = 'id, name, type, balance, currency, color, created_at';
const CATEGORY_COLS = 'id, name, type, color, icon, created_at';
const TX_COLS       = 'id, type, amount, currency, category_id, account_id, to_account_id, date, title, note, tags, is_recurring, recurring_rule, created_at';
const BUDGET_COLS   = 'id, category_id, limit_amount, period, created_at';
const GOAL_COLS     = 'id, name, target_amount, current_amount, deadline, color, currency, created_at';

function rowToAccount(r: any): FinAccount {
  return { id:r.id, name:r.name, type:r.type, balance:r.balance, currency:r.currency, color:r.color, created_at:r.created_at };
}
function rowToCategory(r: any): FinCategory {
  return { id:r.id, name:r.name, type:r.type, color:r.color, icon:r.icon, created_at:r.created_at };
}
function rowToTx(r: any): Transaction {
  return {
    id:r.id, type:r.type, amount:r.amount, currency:r.currency,
    category_id:r.category_id, account_id:r.account_id, to_account_id:r.to_account_id ?? null,
    date:r.date, title:r.title, note:r.note, tags:r.tags,
    is_recurring:r.is_recurring, recurring_rule:r.recurring_rule, created_at:r.created_at,
    category_name:'', category_color:'#98989d', category_icon:'●',
    account_name:'', account_color:'#98989d',
    to_account_name:'', to_account_color:'#98989d',
  };
}
function rowToBudget(r: any): Budget {
  return { id:r.id, category_id:r.category_id, limit_amount:r.limit_amount, period:r.period, created_at:r.created_at,
    category_name:'', category_color:'#98989d', category_icon:'●', spent:0 };
}
function rowToGoal(r: any): Goal {
  return { id:r.id, name:r.name, target_amount:r.target_amount, current_amount:r.current_amount,
    deadline:r.deadline, color:r.color, currency:r.currency, created_at:r.created_at };
}

export class FinanceRepo {
  constructor(private db: Database.Database) {}

  private nowIso(): string {
    return new Date().toISOString().replace(/\.\d{3}Z$/, '+00:00');
  }

  // ── Accounts ──────────────────────────────────────────────────────────────

  listAccounts(): FinAccount[] {
    return (this.db.prepare(`SELECT ${ACCOUNT_COLS} FROM fin_accounts ORDER BY created_at`).all() as any[]).map(rowToAccount);
  }

  getAccount(id: number): FinAccount | null {
    const r = this.db.prepare(`SELECT ${ACCOUNT_COLS} FROM fin_accounts WHERE id=?`).get(id) as any;
    return r ? rowToAccount(r) : null;
  }

  addAccount(name: string, type: string, balance: number, currency: string, color: string): FinAccount {
    const result = this.db.prepare(
      'INSERT INTO fin_accounts(name,type,balance,currency,color,created_at) VALUES(?,?,?,?,?,?)'
    ).run(name, type, balance, currency, color, this.nowIso());
    return this.getAccount(result.lastInsertRowid as number)!;
  }

  updateAccount(id: number, fields: Partial<FinAccount>): void {
    const allowed = ['name', 'type', 'balance', 'currency', 'color'];
    const entries = Object.entries(fields).filter(([k]) => allowed.includes(k));
    if (!entries.length) return;
    const sets = entries.map(([k]) => `${k}=?`).join(', ');
    this.db.prepare(`UPDATE fin_accounts SET ${sets} WHERE id=?`).run(...entries.map(([,v]) => v), id);
  }

  deleteAccount(id: number): void {
    this.db.prepare('DELETE FROM fin_accounts WHERE id=?').run(id);
  }

  // ── Finance Categories ─────────────────────────────────────────────────────

  listFinCategories(type?: string): FinCategory[] {
    if (type) {
      return (this.db.prepare(`SELECT ${CATEGORY_COLS} FROM fin_categories WHERE type=? ORDER BY id`).all(type) as any[]).map(rowToCategory);
    }
    return (this.db.prepare(`SELECT ${CATEGORY_COLS} FROM fin_categories ORDER BY type, id`).all() as any[]).map(rowToCategory);
  }

  addFinCategory(name: string, type: string, color: string, icon: string): FinCategory {
    const result = this.db.prepare(
      'INSERT INTO fin_categories(name,type,color,icon,created_at) VALUES(?,?,?,?,?)'
    ).run(name, type, color, icon, this.nowIso());
    const r = this.db.prepare(`SELECT ${CATEGORY_COLS} FROM fin_categories WHERE id=?`).get(result.lastInsertRowid) as any;
    return rowToCategory(r);
  }

  updateFinCategory(id: number, fields: Partial<FinCategory>): void {
    const allowed = ['name', 'color', 'icon'];
    const entries = Object.entries(fields).filter(([k]) => allowed.includes(k));
    if (!entries.length) return;
    const sets = entries.map(([k]) => `${k}=?`).join(', ');
    this.db.prepare(`UPDATE fin_categories SET ${sets} WHERE id=?`).run(...entries.map(([,v]) => v), id);
  }

  deleteFinCategory(id: number): void {
    this.db.prepare('DELETE FROM fin_categories WHERE id=?').run(id);
  }

  // ── Transactions ───────────────────────────────────────────────────────────

  addTransaction(
    type: string, amount: number, currency: string,
    categoryId: number | null, accountId: number | null,
    date: string, title = '', note = '', tags = '',
    isRecurring = 0, recurringRule: string | null = null
  ): Transaction {
    const result = this.db.prepare(
      'INSERT INTO fin_transactions(type,amount,currency,category_id,account_id,date,title,note,tags,is_recurring,recurring_rule,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)'
    ).run(type, amount, currency, categoryId, accountId, date, title, note, tags, isRecurring, recurringRule, this.nowIso());
    return this.getTransaction(result.lastInsertRowid as number)!;
  }

  addTransfer(fromAccountId: number, toAccountId: number, amount: number, currency: string, date: string, title = ''): Transaction {
    const now = this.nowIso();
    const tx = this.db.transaction(() => {
      // Debit from source
      const result = this.db.prepare(
        'INSERT INTO fin_transactions(type,amount,currency,account_id,to_account_id,date,title,note,tags,is_recurring,recurring_rule,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)'
      ).run('transfer', amount, currency, fromAccountId, toAccountId, date, title || 'Transfer', '', '', 0, null, now);
      // Update balances
      this.db.prepare('UPDATE fin_accounts SET balance = balance - ? WHERE id = ?').run(amount, fromAccountId);
      this.db.prepare('UPDATE fin_accounts SET balance = balance + ? WHERE id = ?').run(amount, toAccountId);
      return result.lastInsertRowid as number;
    });
    const id = tx();
    return this.getTransaction(id)!;
  }

  getTransaction(id: number): Transaction | null {
    const r = this.db.prepare(`SELECT ${TX_COLS} FROM fin_transactions WHERE id=?`).get(id) as any;
    if (!r) return null;
    const tx = rowToTx(r);
    this.fillTxVirtuals([tx]);
    return tx;
  }

  listTransactions(opts: {
    since?: string; until?: string; type?: string;
    accountId?: number; categoryId?: number; search?: string; limit?: number;
  } = {}): Transaction[] {
    let q = `SELECT ${TX_COLS} FROM fin_transactions WHERE 1=1`;
    const p: any[] = [];
    if (opts.since)      { q += ' AND date >= ?';                   p.push(opts.since); }
    if (opts.until)      { q += ' AND date <= ?';                   p.push(opts.until); }
    if (opts.type)       { q += ' AND type = ?';                    p.push(opts.type); }
    if (opts.accountId)  { q += ' AND account_id = ?';              p.push(opts.accountId); }
    if (opts.categoryId) { q += ' AND category_id = ?';             p.push(opts.categoryId); }
    if (opts.search)     { q += ' AND (title LIKE ? OR note LIKE ?)'; p.push(`%${opts.search}%`, `%${opts.search}%`); }
    q += ' ORDER BY date DESC, id DESC';
    q += ` LIMIT ${opts.limit ?? 500}`;
    const txs = (this.db.prepare(q).all(...p) as any[]).map(rowToTx);
    this.fillTxVirtuals(txs);
    return txs;
  }

  private fillTxVirtuals(txs: Transaction[]): void {
    const cats: Record<number, FinCategory> = {};
    for (const c of this.listFinCategories()) cats[c.id] = c;
    const accs: Record<number, FinAccount> = {};
    for (const a of this.listAccounts()) accs[a.id] = a;
    for (const tx of txs) {
      if (tx.category_id && cats[tx.category_id]) {
        const c = cats[tx.category_id];
        tx.category_name = c.name; tx.category_color = c.color; tx.category_icon = c.icon;
      }
      if (tx.account_id && accs[tx.account_id]) {
        const a = accs[tx.account_id];
        tx.account_name = a.name; tx.account_color = a.color;
      }
      if (tx.to_account_id && accs[tx.to_account_id]) {
        const a = accs[tx.to_account_id];
        tx.to_account_name = a.name; tx.to_account_color = a.color;
      }
    }
  }

  updateTransaction(id: number, fields: Partial<Transaction>): void {
    const allowed = ['type', 'amount', 'currency', 'category_id', 'account_id', 'date', 'title', 'note', 'tags', 'is_recurring', 'recurring_rule'];
    const entries = Object.entries(fields).filter(([k]) => allowed.includes(k));
    if (!entries.length) return;
    const sets = entries.map(([k]) => `${k}=?`).join(', ');
    this.db.prepare(`UPDATE fin_transactions SET ${sets} WHERE id=?`).run(...entries.map(([,v]) => v), id);
  }

  deleteTransaction(id: number): void {
    this.db.prepare('DELETE FROM fin_transactions WHERE id=?').run(id);
  }

  // ── Budgets ────────────────────────────────────────────────────────────────

  listBudgets(): Budget[] {
    const rows = (this.db.prepare(`SELECT ${BUDGET_COLS} FROM fin_budgets ORDER BY id`).all() as any[]).map(rowToBudget);
    const cats: Record<number, FinCategory> = {};
    for (const c of this.listFinCategories()) cats[c.id] = c;
    for (const b of rows) {
      if (cats[b.category_id]) {
        const c = cats[b.category_id];
        b.category_name = c.name; b.category_color = c.color; b.category_icon = c.icon;
      }
    }
    return rows;
  }

  addBudget(categoryId: number, limitAmount: number, period: string): Budget {
    const result = this.db.prepare(
      'INSERT INTO fin_budgets(category_id,limit_amount,period,created_at) VALUES(?,?,?,?)'
    ).run(categoryId, limitAmount, period, this.nowIso());
    const r = this.db.prepare(`SELECT ${BUDGET_COLS} FROM fin_budgets WHERE id=?`).get(result.lastInsertRowid) as any;
    return rowToBudget(r);
  }

  updateBudget(id: number, fields: Partial<Budget>): void {
    const allowed = ['limit_amount', 'period', 'category_id'];
    const entries = Object.entries(fields).filter(([k]) => allowed.includes(k));
    if (!entries.length) return;
    const sets = entries.map(([k]) => `${k}=?`).join(', ');
    this.db.prepare(`UPDATE fin_budgets SET ${sets} WHERE id=?`).run(...entries.map(([,v]) => v), id);
  }

  deleteBudget(id: number): void {
    this.db.prepare('DELETE FROM fin_budgets WHERE id=?').run(id);
  }

  budgetSpent(categoryId: number, since: string, until: string): number {
    const r = this.db.prepare(
      "SELECT COALESCE(SUM(amount),0) FROM fin_transactions WHERE type='expense' AND category_id=? AND date>=? AND date<=?"
    ).raw().get(categoryId, since, until) as any;
    return r ? (r[0] as number) : 0;
  }

  // ── Goals ──────────────────────────────────────────────────────────────────

  listGoals(): Goal[] {
    return (this.db.prepare(`SELECT ${GOAL_COLS} FROM fin_goals ORDER BY created_at`).all() as any[]).map(rowToGoal);
  }

  getGoal(id: number): Goal | null {
    const r = this.db.prepare(`SELECT ${GOAL_COLS} FROM fin_goals WHERE id=?`).get(id) as any;
    return r ? rowToGoal(r) : null;
  }

  addGoal(name: string, targetAmount: number, currentAmount: number, currency: string, color: string, deadline: string | null = null): Goal {
    const result = this.db.prepare(
      'INSERT INTO fin_goals(name,target_amount,current_amount,deadline,color,currency,created_at) VALUES(?,?,?,?,?,?,?)'
    ).run(name, targetAmount, currentAmount, deadline, color, currency, this.nowIso());
    return this.getGoal(result.lastInsertRowid as number)!;
  }

  updateGoal(id: number, fields: Partial<Goal>): void {
    const allowed = ['name', 'target_amount', 'current_amount', 'deadline', 'color', 'currency'];
    const entries = Object.entries(fields).filter(([k]) => allowed.includes(k));
    if (!entries.length) return;
    const sets = entries.map(([k]) => `${k}=?`).join(', ');
    this.db.prepare(`UPDATE fin_goals SET ${sets} WHERE id=?`).run(...entries.map(([,v]) => v), id);
  }

  deleteGoal(id: number): void {
    this.db.prepare('DELETE FROM fin_goals WHERE id=?').run(id);
  }

  addToGoal(id: number, amount: number): void {
    this.db.prepare('UPDATE fin_goals SET current_amount = MIN(target_amount, current_amount+?) WHERE id=?').run(amount, id);
  }

  // ── Analytics ──────────────────────────────────────────────────────────────

  totalBalance(): Record<string, number> {
    const rows = this.db.prepare('SELECT currency, SUM(balance) AS total FROM fin_accounts GROUP BY currency').all() as any[];
    const result: Record<string, number> = {};
    for (const r of rows) result[r.currency as string] = r.total as number;
    return result;
  }

  summary(since: string, until: string): { income: number; expenses: number; net: number; avg_per_day: number } {
    const inc = ((this.db.prepare("SELECT COALESCE(SUM(amount),0) FROM fin_transactions WHERE type='income' AND date>=? AND date<=?").raw().get(since, until) as any)[0]) as number;
    const exp = ((this.db.prepare("SELECT COALESCE(SUM(amount),0) FROM fin_transactions WHERE type='expense' AND date>=? AND date<=?").raw().get(since, until) as any)[0]) as number;
    const d0 = new Date(since); const d1 = new Date(until);
    const nDays = Math.max(1, Math.round((d1.getTime() - d0.getTime()) / 86400000) + 1);
    return { income: inc, expenses: exp, net: inc - exp, avg_per_day: exp / nDays };
  }

  dailyFlow(since: string, until: string): Array<[string, number, number]> {
    const rows = this.db.prepare(`
      SELECT date,
        COALESCE(SUM(CASE WHEN type='income'  THEN amount ELSE 0 END), 0) as inc,
        COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) as exp
      FROM fin_transactions WHERE date >= ? AND date <= ?
      GROUP BY date ORDER BY date
    `).all(since, until) as any[];

    const rowMap: Record<string, [number, number]> = {};
    for (const r of rows) rowMap[r.date as string] = [r.inc as number, r.exp as number];

    const result: Array<[string, number, number]> = [];
    const cur = new Date(since);
    const end = new Date(until);
    while (cur <= end) {
      const ds = cur.toISOString().slice(0, 10);
      const [inc, exp] = rowMap[ds] ?? [0, 0];
      result.push([ds, inc, exp]);
      cur.setDate(cur.getDate() + 1);
    }
    return result;
  }

  expenseByCategory(since: string, until: string): Array<{ category_id: number | null; name: string; color: string; icon: string; total: number }> {
    const rows = this.db.prepare(`
      SELECT t.category_id, c.name, c.color, c.icon, COALESCE(SUM(t.amount), 0) as total
      FROM fin_transactions t
      LEFT JOIN fin_categories c ON c.id = t.category_id
      WHERE t.type='expense' AND t.date>=? AND t.date<=? AND t.category_id IS NOT NULL
      GROUP BY t.category_id ORDER BY total DESC
    `).all(since, until) as any[];
    return rows.map((r: any) => ({
      category_id: r.category_id, name: r.name || '?', color: r.color || '#98989d', icon: r.icon || '●', total: r.total,
    }));
  }

  cumulativeBalance(since: string, until: string): Array<[string, number]> {
    const rows = this.db.prepare(`
      SELECT date,
        SUM(CASE WHEN type='income' THEN amount ELSE 0 END) -
        SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as net
      FROM fin_transactions WHERE date >= ? AND date <= ?
      GROUP BY date ORDER BY date
    `).all(since, until) as any[];
    const rowMap: Record<string, number> = {};
    for (const r of rows) rowMap[r.date as string] = r.net as number;

    const result: Array<[string, number]> = [];
    let cum = 0;
    const cur = new Date(since);
    const end = new Date(until);
    while (cur <= end) {
      const ds = cur.toISOString().slice(0, 10);
      cum += rowMap[ds] ?? 0;
      result.push([ds, cum]);
      cur.setDate(cur.getDate() + 1);
    }
    return result;
  }
}
