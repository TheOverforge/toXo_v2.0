import { ipcMain } from 'electron';
import type { AppDatabase } from '../db/database.js';

export function registerCategoryHandlers(db: AppDatabase): void {
  ipcMain.handle('categories:list',   ()                                         => db.categories.listCategories());
  ipcMain.handle('categories:add',    (_, name: string, color: string)           => db.categories.addCategory(name, color));
  ipcMain.handle('categories:update', (_, id: number, name: string, color: string) => db.categories.updateCategory(id, name, color));
  ipcMain.handle('categories:delete', (_, id: number)                            => db.categories.deleteCategory(id));
  ipcMain.handle('categories:reorder',(_, ids: number[])                         => db.categories.reorderCategories(ids));
}
