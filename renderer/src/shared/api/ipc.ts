// Typed wrapper around window.electronAPI exposed by the preload script.
// The renderer never imports 'electron' directly.

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export interface ElectronAPI {
  tasks: {
    list: () => Promise<import('@/entities/task/model').Task[]>;
    get: (id: number) => Promise<import('@/entities/task/model').Task | null>;
    create: (d: { title?: string; description?: string; categoryId?: number }) => Promise<number>;
    update: (id: number, d: { title: string; description: string }) => Promise<void>;
    updateFields: (id: number, d: Partial<import('@/entities/task/model').Task>) => Promise<void>;
    delete: (id: number) => Promise<void>;
    setDone: (id: number, v: boolean) => Promise<void>;
    setPriority: (id: number, v: number) => Promise<void>;
    setPinned: (id: number, v: boolean) => Promise<void>;
    setRecurrence: (id: number, v: string | null) => Promise<void>;
    setReminder: (id: number, v: string | null) => Promise<void>;
    setDeadline: (id: number, v: string | null) => Promise<void>;
    setCategory: (id: number, v: number | null) => Promise<void>;
    setTags: (id: number, v: string) => Promise<void>;
    reorder: (ids: number[]) => Promise<void>;
    archive: (id: number, v: boolean) => Promise<void>;
    archiveCompleted: (olderThan: string) => Promise<number>;
    clearArchive: () => Promise<number>;
    duplicate: (id: number) => Promise<number | null>;
    restore: (snap: any) => Promise<number>;
    getByDeadlineDate: (d: string) => Promise<import('@/entities/task/model').Task[]>;
    logEvent: (id: number, t: string) => Promise<void>;
    exportJson: (p: string) => Promise<void>;
    exportCsv: (p: string) => Promise<void>;
    importJson: (p: string) => Promise<number>;
    loadDemo:          () => Promise<void>;
    clearAll:          () => Promise<void>;
    ensureWelcomeTask: () => Promise<number>;
  };
  subtasks: {
    list: (taskId: number) => Promise<import('@/entities/task/model').Subtask[]>;
    add: (taskId: number, title: string) => Promise<number>;
    setDone: (id: number, done: boolean) => Promise<void>;
    rename: (id: number, title: string) => Promise<void>;
    delete: (id: number) => Promise<void>;
    reorder: (taskId: number, ids: number[]) => Promise<void>;
    counts: () => Promise<Record<number, [number, number]>>;
  };
  categories: {
    list: () => Promise<import('@/entities/category/model').Category[]>;
    add: (name: string, color: string) => Promise<number>;
    update: (id: number, name: string, color: string) => Promise<void>;
    delete: (id: number) => Promise<void>;
    reorder: (ids: number[]) => Promise<void>;
  };
  analytics: {
    getKpi: (since: string, until?: string) => Promise<any>;
    completedPerDay: (since: string, until?: string) => Promise<[string, number][]>;
    createdVsCompleted: (since: string, until?: string) => Promise<[string, number, number][]>;
    statusDistribution: (since: string, until?: string) => Promise<{ active: number; done: number }>;
    completedByWeekday: (since: string, until?: string) => Promise<[number, number][]>;
    completedByCategory: (since: string, until?: string) => Promise<any[]>;
    priorityDistribution: (since: string, until?: string) => Promise<any[]>;
  };
  finance: {
    accounts: {
      list: () => Promise<any[]>;
      add: (d: any) => Promise<any>;
      update: (id: number, d: any) => Promise<void>;
      delete: (id: number) => Promise<void>;
    };
    categories: {
      list: (type?: string) => Promise<any[]>;
      add: (d: any) => Promise<any>;
      update: (id: number, d: any) => Promise<void>;
      delete: (id: number) => Promise<void>;
    };
    transactions: {
      list: (opts: any) => Promise<any[]>;
      add: (d: any) => Promise<any>;
      transfer: (d: any) => Promise<any>;
      update: (id: number, d: any) => Promise<void>;
      delete: (id: number) => Promise<void>;
      summary: (since: string, until: string) => Promise<any>;
      dailyFlow: (since: string, until: string) => Promise<any[]>;
      expenseByCategory: (since: string, until: string) => Promise<any[]>;
      cumulativeBalance: (since: string, until: string) => Promise<any[]>;
      totalBalance: () => Promise<Record<string, number>>;
    };
    budgets: {
      list: () => Promise<any[]>;
      add: (d: any) => Promise<any>;
      update: (id: number, d: any) => Promise<void>;
      delete: (id: number) => Promise<void>;
      getSpent: (catId: number, since: string, until: string) => Promise<number>;
    };
    goals: {
      list: () => Promise<any[]>;
      add: (d: any) => Promise<any>;
      update: (id: number, d: any) => Promise<void>;
      delete: (id: number) => Promise<void>;
      addTo: (id: number, amount: number) => Promise<void>;
    };
  };
  settings: {
    get: (key: string, def?: unknown) => Promise<unknown>;
    set: (key: string, val: unknown) => Promise<void>;
    getAll: () => Promise<Record<string, unknown>>;
  };
  shell: {
    showSaveDialog: (opts: any) => Promise<{ canceled: boolean; filePath?: string }>;
    showOpenDialog: (opts: any) => Promise<{ canceled: boolean; filePaths: string[] }>;
  };
  on: (channel: string, fn: (...args: unknown[]) => void) => () => void;
  titlebar: {
    setTheme: (theme: string) => void;
  };
  window: {
    minimize:    () => Promise<void>;
    maximize:    () => Promise<void>;
    close:       () => Promise<void>;
    isMaximized: () => Promise<boolean>;
  };
}

export const ipc: ElectronAPI = window.electronAPI;
