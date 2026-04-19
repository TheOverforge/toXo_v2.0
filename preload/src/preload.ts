import { contextBridge, ipcRenderer } from 'electron';

const api = {
  tasks: {
    list:              ()                => ipcRenderer.invoke('tasks:list'),
    get:               (id: number)      => ipcRenderer.invoke('tasks:get', id),
    create:            (d: any)          => ipcRenderer.invoke('tasks:create', d),
    update:            (id: number, d: any) => ipcRenderer.invoke('tasks:update', id, d),
    updateFields:      (id: number, d: any) => ipcRenderer.invoke('tasks:updateFields', id, d),
    delete:            (id: number)      => ipcRenderer.invoke('tasks:delete', id),
    setDone:           (id: number, v: boolean) => ipcRenderer.invoke('tasks:setDone', id, v),
    setPriority:       (id: number, v: number)  => ipcRenderer.invoke('tasks:setPriority', id, v),
    setPinned:         (id: number, v: boolean) => ipcRenderer.invoke('tasks:setPinned', id, v),
    setRecurrence:     (id: number, v: string | null) => ipcRenderer.invoke('tasks:setRecurrence', id, v),
    setReminder:       (id: number, v: string | null) => ipcRenderer.invoke('tasks:setReminder', id, v),
    setDeadline:       (id: number, v: string | null) => ipcRenderer.invoke('tasks:setDeadline', id, v),
    setCategory:       (id: number, v: number | null) => ipcRenderer.invoke('tasks:setCategory', id, v),
    setTags:           (id: number, v: string) => ipcRenderer.invoke('tasks:setTags', id, v),
    reorder:           (ids: number[])   => ipcRenderer.invoke('tasks:reorder', ids),
    archive:           (id: number, v: boolean) => ipcRenderer.invoke('tasks:archive', id, v),
    archiveCompleted:  (olderThan: string)      => ipcRenderer.invoke('tasks:archiveCompleted', olderThan),
    clearArchive:      ()                => ipcRenderer.invoke('tasks:clearArchive'),
    duplicate:         (id: number)      => ipcRenderer.invoke('tasks:duplicate', id),
    restore:           (snap: any)       => ipcRenderer.invoke('tasks:restore', snap),
    getByDeadlineDate: (d: string)       => ipcRenderer.invoke('tasks:getByDeadlineDate', d),
    logEvent:          (id: number, t: string) => ipcRenderer.invoke('tasks:logEvent', id, t),
    exportJson:        (p: string)       => ipcRenderer.invoke('tasks:exportJson', p),
    exportCsv:         (p: string)       => ipcRenderer.invoke('tasks:exportCsv', p),
    importJson:        (p: string)       => ipcRenderer.invoke('tasks:importJson', p),
    loadDemo:             ()                => ipcRenderer.invoke('tasks:loadDemo'),
    clearAll:             ()                => ipcRenderer.invoke('tasks:clearAll'),
    ensureWelcomeTask:    ()                => ipcRenderer.invoke('tasks:ensureWelcomeTask'),
  },

  subtasks: {
    list:    (taskId: number)                    => ipcRenderer.invoke('subtasks:list', taskId),
    add:     (taskId: number, title: string)     => ipcRenderer.invoke('subtasks:add', taskId, title),
    setDone: (id: number, done: boolean)         => ipcRenderer.invoke('subtasks:setDone', id, done),
    rename:  (id: number, title: string)         => ipcRenderer.invoke('subtasks:rename', id, title),
    delete:  (id: number)                        => ipcRenderer.invoke('subtasks:delete', id),
    reorder: (taskId: number, ids: number[])     => ipcRenderer.invoke('subtasks:reorder', taskId, ids),
    counts:  ()                                  => ipcRenderer.invoke('subtasks:counts'),
  },

  categories: {
    list:   ()                                         => ipcRenderer.invoke('categories:list'),
    add:    (name: string, color: string)              => ipcRenderer.invoke('categories:add', name, color),
    update: (id: number, name: string, color: string)  => ipcRenderer.invoke('categories:update', id, name, color),
    delete: (id: number)                               => ipcRenderer.invoke('categories:delete', id),
    reorder:(ids: number[])                            => ipcRenderer.invoke('categories:reorder', ids),
  },

  analytics: {
    getKpi:               (since: string, until?: string) => ipcRenderer.invoke('analytics:getKpi', since, until),
    completedPerDay:      (since: string, until?: string) => ipcRenderer.invoke('analytics:completedPerDay', since, until),
    createdVsCompleted:   (since: string, until?: string) => ipcRenderer.invoke('analytics:createdVsCompleted', since, until),
    statusDistribution:   (since: string, until?: string) => ipcRenderer.invoke('analytics:statusDistribution', since, until),
    completedByWeekday:   (since: string, until?: string) => ipcRenderer.invoke('analytics:completedByWeekday', since, until),
    completedByCategory:  (since: string, until?: string) => ipcRenderer.invoke('analytics:completedByCategory', since, until),
    priorityDistribution: (since: string, until?: string) => ipcRenderer.invoke('analytics:priorityDistribution', since, until),
  },

  finance: {
    accounts: {
      list:   ()                      => ipcRenderer.invoke('fin:accounts:list'),
      add:    (d: any)                => ipcRenderer.invoke('fin:accounts:add', d),
      update: (id: number, d: any)    => ipcRenderer.invoke('fin:accounts:update', id, d),
      delete: (id: number)            => ipcRenderer.invoke('fin:accounts:delete', id),
    },
    categories: {
      list:   (type?: string)         => ipcRenderer.invoke('fin:categories:list', type),
      add:    (d: any)                => ipcRenderer.invoke('fin:categories:add', d),
      update: (id: number, d: any)    => ipcRenderer.invoke('fin:categories:update', id, d),
      delete: (id: number)            => ipcRenderer.invoke('fin:categories:delete', id),
    },
    transactions: {
      list:              (opts: any)                        => ipcRenderer.invoke('fin:tx:list', opts),
      add:               (d: any)                           => ipcRenderer.invoke('fin:tx:add', d),
      transfer:          (d: any)                           => ipcRenderer.invoke('fin:tx:transfer', d),
      update:            (id: number, d: any)               => ipcRenderer.invoke('fin:tx:update', id, d),
      delete:            (id: number)                       => ipcRenderer.invoke('fin:tx:delete', id),
      summary:           (since: string, until: string)     => ipcRenderer.invoke('fin:tx:summary', since, until),
      dailyFlow:         (since: string, until: string)     => ipcRenderer.invoke('fin:tx:dailyFlow', since, until),
      expenseByCategory: (since: string, until: string)     => ipcRenderer.invoke('fin:tx:expenseByCategory', since, until),
      cumulativeBalance: (since: string, until: string)     => ipcRenderer.invoke('fin:tx:cumulativeBalance', since, until),
      totalBalance:      ()                                 => ipcRenderer.invoke('fin:tx:totalBalance'),
    },
    budgets: {
      list:     ()                                              => ipcRenderer.invoke('fin:budgets:list'),
      add:      (d: any)                                        => ipcRenderer.invoke('fin:budgets:add', d),
      update:   (id: number, d: any)                           => ipcRenderer.invoke('fin:budgets:update', id, d),
      delete:   (id: number)                                   => ipcRenderer.invoke('fin:budgets:delete', id),
      getSpent: (catId: number, since: string, until: string)  => ipcRenderer.invoke('fin:budgets:getSpent', catId, since, until),
    },
    goals: {
      list:   ()                      => ipcRenderer.invoke('fin:goals:list'),
      add:    (d: any)                => ipcRenderer.invoke('fin:goals:add', d),
      update: (id: number, d: any)    => ipcRenderer.invoke('fin:goals:update', id, d),
      delete: (id: number)            => ipcRenderer.invoke('fin:goals:delete', id),
      addTo:  (id: number, amount: number) => ipcRenderer.invoke('fin:goals:addTo', id, amount),
    },
  },

  settings: {
    get:    (key: string, def?: unknown) => ipcRenderer.invoke('settings:get', key, def),
    set:    (key: string, val: unknown)  => ipcRenderer.invoke('settings:set', key, val),
    getAll: ()                           => ipcRenderer.invoke('settings:getAll'),
  },

  shell: {
    showSaveDialog: (opts: any) => ipcRenderer.invoke('shell:showSaveDialog', opts),
    showOpenDialog: (opts: any) => ipcRenderer.invoke('shell:showOpenDialog', opts),
  },

  // Push events: main → renderer
  on: (channel: string, fn: (...args: unknown[]) => void) => {
    const listener = (_evt: Electron.IpcRendererEvent, ...args: unknown[]) => fn(...args);
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
  },

  titlebar: {
    setTheme: (theme: string) => ipcRenderer.send('titlebar:setTheme', theme),
  },

  window: {
    minimize:    () => ipcRenderer.invoke('window:minimize'),
    maximize:    () => ipcRenderer.invoke('window:maximize'),
    close:       () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized') as Promise<boolean>,
  },
};

contextBridge.exposeInMainWorld('electronAPI', api);

export type ElectronAPI = typeof api;
