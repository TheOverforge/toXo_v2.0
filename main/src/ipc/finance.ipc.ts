import { ipcMain } from 'electron';
import type { AppDatabase } from '../db/database.js';

export function registerFinanceHandlers(db: AppDatabase): void {
  // Accounts
  ipcMain.handle('fin:accounts:list',   ()                       => db.finance.listAccounts());
  ipcMain.handle('fin:accounts:add',    (_, d: any)              => db.finance.addAccount(d.name, d.type, d.balance, d.currency, d.color));
  ipcMain.handle('fin:accounts:update', (_, id: number, d: any)  => db.finance.updateAccount(id, d));
  ipcMain.handle('fin:accounts:delete', (_, id: number)          => db.finance.deleteAccount(id));

  // Finance Categories
  ipcMain.handle('fin:categories:list',   (_, type?: string)     => db.finance.listFinCategories(type));
  ipcMain.handle('fin:categories:add',    (_, d: any)            => db.finance.addFinCategory(d.name, d.type, d.color, d.icon));
  ipcMain.handle('fin:categories:update', (_, id: number, d: any)=> db.finance.updateFinCategory(id, d));
  ipcMain.handle('fin:categories:delete', (_, id: number)        => db.finance.deleteFinCategory(id));

  // Transactions
  ipcMain.handle('fin:tx:list',   (_, opts: any)                 => db.finance.listTransactions(opts));
  ipcMain.handle('fin:tx:add',    (_, d: any)                    => db.finance.addTransaction(
    d.type, d.amount, d.currency, d.category_id ?? null, d.account_id ?? null,
    d.date, d.title, d.note, d.tags, d.is_recurring, d.recurring_rule));
  ipcMain.handle('fin:tx:transfer', (_, d: any)                  => db.finance.addTransfer(
    d.from_account_id, d.to_account_id, d.amount, d.currency, d.date, d.title));
  ipcMain.handle('fin:tx:update', (_, id: number, d: any)        => db.finance.updateTransaction(id, d));
  ipcMain.handle('fin:tx:delete', (_, id: number)                => db.finance.deleteTransaction(id));
  ipcMain.handle('fin:tx:summary',(_, since: string, until: string) => db.finance.summary(since, until));
  ipcMain.handle('fin:tx:dailyFlow', (_, since: string, until: string) => db.finance.dailyFlow(since, until));
  ipcMain.handle('fin:tx:expenseByCategory', (_, since: string, until: string) => db.finance.expenseByCategory(since, until));
  ipcMain.handle('fin:tx:cumulativeBalance', (_, since: string, until: string) => db.finance.cumulativeBalance(since, until));
  ipcMain.handle('fin:tx:totalBalance', () => db.finance.totalBalance());

  // Budgets
  ipcMain.handle('fin:budgets:list',     ()                             => db.finance.listBudgets());
  ipcMain.handle('fin:budgets:add',      (_, d: any)                   => db.finance.addBudget(d.category_id, d.limit_amount, d.period));
  ipcMain.handle('fin:budgets:update',   (_, id: number, d: any)       => db.finance.updateBudget(id, d));
  ipcMain.handle('fin:budgets:delete',   (_, id: number)               => db.finance.deleteBudget(id));
  ipcMain.handle('fin:budgets:getSpent', (_, catId: number, since: string, until: string) =>
    db.finance.budgetSpent(catId, since, until));

  // Goals
  ipcMain.handle('fin:goals:list',   ()                      => db.finance.listGoals());
  ipcMain.handle('fin:goals:add',    (_, d: any)             => db.finance.addGoal(d.name, d.target_amount, d.current_amount, d.currency, d.color, d.deadline));
  ipcMain.handle('fin:goals:update', (_, id: number, d: any) => db.finance.updateGoal(id, d));
  ipcMain.handle('fin:goals:delete', (_, id: number)         => db.finance.deleteGoal(id));
  ipcMain.handle('fin:goals:addTo',  (_, id: number, amount: number) => db.finance.addToGoal(id, amount));
}
