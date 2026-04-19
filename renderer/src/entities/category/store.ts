import { create } from 'zustand';
import { ipc } from '@/shared/api/ipc';
import type { Category } from './model';

interface CategoryState {
  categories: Category[];
  fetchAll: () => Promise<void>;
  addCategory: (name: string, color: string) => Promise<void>;
  updateCategory: (id: number, name: string, color: string) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
  reorder: (ids: number[]) => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],

  fetchAll: async () => {
    const categories = await ipc.categories.list();
    set({ categories });
  },

  addCategory: async (name, color) => {
    await ipc.categories.add(name, color);
    await get().fetchAll();
  },

  updateCategory: async (id, name, color) => {
    await ipc.categories.update(id, name, color);
    set(s => ({
      categories: s.categories.map(c => c.id === id ? { ...c, name, color } : c),
    }));
  },

  deleteCategory: async (id) => {
    await ipc.categories.delete(id);
    set(s => ({ categories: s.categories.filter(c => c.id !== id) }));
  },

  reorder: async (ids) => {
    await ipc.categories.reorder(ids);
    await get().fetchAll();
  },
}));
