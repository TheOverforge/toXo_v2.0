import { create } from 'zustand';
import { ipc } from '@/shared/api/ipc';
import { useHistoryStore } from '@/shared/lib/undoRedo';
import type { Task, Subtask } from './model';

export type FilterMode = 'all' | 'active' | 'done' | 'today' | 'archive';
export type SortMode = 'new' | 'old' | 'alpha' | 'undone' | 'manual';

interface TaskState {
  tasks: Task[];
  subtasks: Record<number, Subtask[]>;
  selectedTaskId: number | null;
  selectedTaskIds: number[];
  filterMode: FilterMode;
  sortMode: SortMode;
  searchQuery: string;
  currentCategoryId: number | null | 'all';
  loading: boolean;

  fetchAll: () => Promise<void>;
  createTask: (title?: string, description?: string, categoryId?: number) => Promise<number>;
  updateTask: (id: number, title: string, description: string) => Promise<void>;
  updateFields: (id: number, fields: Partial<Task>) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
  setDone: (id: number, done: boolean) => Promise<void>;
  selectTask: (id: number | null) => void;
  toggleSelectTask: (id: number) => void;
  selectAll: (ids: number[]) => void;
  addToSelection: (ids: number[]) => void;
  clearMultiSelect: () => void;
  bulkDelete: (ids: number[]) => Promise<void>;
  bulkSetDone: (ids: number[], done: boolean) => Promise<void>;
  setFilter: (mode: FilterMode) => void;
  setSort: (mode: SortMode) => void;
  setSearch: (q: string) => void;
  setCategoryFilter: (id: number | null | 'all') => void;
  loadSubtasks: (taskId: number) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  subtasks: {},
  selectedTaskId: null,
  selectedTaskIds: [],
  filterMode: 'all',
  sortMode: 'new',
  searchQuery: '',
  currentCategoryId: 'all',
  loading: false,

  fetchAll: async () => {
    set({ loading: true });
    const tasks = await ipc.tasks.list();
    set({ tasks, loading: false });
  },

  createTask: async (title = '', description = '', categoryId?: number) => {
    const id = await ipc.tasks.create({ title, description, categoryId });
    await get().fetchAll();
    return id as number;
  },

  updateTask: async (id, title, description) => {
    await ipc.tasks.update(id, { title, description });
    set(s => ({
      tasks: s.tasks.map(t => t.id === id ? { ...t, title, description } : t),
    }));
  },

  updateFields: async (id, fields) => {
    await ipc.tasks.updateFields(id, fields);
    set(s => ({
      tasks: s.tasks.map(t => t.id === id ? { ...t, ...fields } : t),
    }));
  },

  deleteTask: async (id) => {
    const task = get().tasks.find(t => t.id === id);
    if (!task) return;

    // snapshot subtasks before they're cascade-deleted
    const subs = await ipc.subtasks.list(id);

    await ipc.tasks.delete(id);
    set(s => ({
      tasks: s.tasks.filter(t => t.id !== id),
      selectedTaskId: s.selectedTaskId === id ? null : s.selectedTaskId,
    }));

    let restoredId = -1;
    useHistoryStore.getState().push({
      label: `Удалить "${task.title || 'Без названия'}"`,
      undo: async () => {
        restoredId = await ipc.tasks.restore(task);
        for (const sub of subs) {
          const subId = await ipc.subtasks.add(restoredId, sub.title);
          if (sub.is_done) await ipc.subtasks.setDone(subId, true);
        }
        await get().fetchAll();
        get().selectTask(restoredId);
      },
      redo: async () => {
        if (restoredId !== -1) await ipc.tasks.delete(restoredId);
        await get().fetchAll();
        get().selectTask(null);
      },
    });
  },

  setDone: async (id, done) => {
    await ipc.tasks.setDone(id, done);
    const now = new Date().toISOString();
    set(s => ({
      tasks: s.tasks.map(t =>
        t.id === id
          ? { ...t, is_done: done, completed_at: done ? now : null }
          : t
      ),
    }));
  },

  selectTask: (id) => set({ selectedTaskId: id, selectedTaskIds: [] }),

  toggleSelectTask: (id) => set(s => {
    const ids = s.selectedTaskIds.includes(id)
      ? s.selectedTaskIds.filter(i => i !== id)
      : [...s.selectedTaskIds, id];
    return { selectedTaskIds: ids, selectedTaskId: ids.length === 1 ? ids[0] : s.selectedTaskId };
  }),

  selectAll: (ids) => set({ selectedTaskIds: ids, selectedTaskId: null }),

  addToSelection: (ids) => set(s => ({
    selectedTaskIds: [...new Set([...s.selectedTaskIds, ...ids])],
    selectedTaskId: null,
  })),

  clearMultiSelect: () => set({ selectedTaskIds: [] }),

  bulkDelete: async (ids) => {
    for (const id of ids) {
      await ipc.tasks.delete(id);
    }
    set(s => ({
      tasks: s.tasks.filter(t => !ids.includes(t.id)),
      selectedTaskIds: [],
      selectedTaskId: ids.includes(s.selectedTaskId!) ? null : s.selectedTaskId,
    }));
  },

  bulkSetDone: async (ids, done) => {
    for (const id of ids) {
      await ipc.tasks.setDone(id, done);
    }
    const now = new Date().toISOString();
    set(s => ({
      tasks: s.tasks.map(t =>
        ids.includes(t.id)
          ? { ...t, is_done: done, completed_at: done ? now : null }
          : t
      ),
      selectedTaskIds: [],
    }));
  },

  setFilter: (mode) => set({ filterMode: mode }),
  setSort:   (mode) => set({ sortMode: mode }),
  setSearch: (q)    => set({ searchQuery: q }),
  setCategoryFilter: (id) => set({ currentCategoryId: id }),

  loadSubtasks: async (taskId) => {
    const subs = await ipc.subtasks.list(taskId);
    set(s => ({ subtasks: { ...s.subtasks, [taskId]: subs } }));
  },
}));
