import { create } from 'zustand';

export interface UndoAction {
  label: string;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
}

interface HistoryState {
  past: UndoAction[];
  future: UndoAction[];
  push: (action: UndoAction) => void;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  past: [],
  future: [],

  push: (action) => {
    set(s => ({ past: [...s.past, action], future: [] }));
  },

  undo: async () => {
    const { past } = get();
    if (past.length === 0) return;
    const action = past[past.length - 1];
    set(s => ({ past: s.past.slice(0, -1), future: [action, ...s.future] }));
    await action.undo();
  },

  redo: async () => {
    const { future } = get();
    if (future.length === 0) return;
    const action = future[0];
    set(s => ({ past: [...s.past, action], future: s.future.slice(1) }));
    await action.redo();
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,
}));
