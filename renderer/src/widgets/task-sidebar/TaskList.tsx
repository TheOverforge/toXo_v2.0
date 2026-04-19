import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDrag } from 'react-dnd';
import { useTaskStore } from '@/entities/task/store';
import { useCategoryStore } from '@/entities/category/store';
import type { Task } from '@/entities/task/model';
import { format, isToday } from 'date-fns';
import { ipc } from '@/shared/api/ipc';

export const DND_TASK = 'TASK';

const PRIORITY_COLORS = ['transparent', '#64d2ff', '#ff9f43', '#ff453a'];

function filterAndSort(tasks: Task[], state: ReturnType<typeof useTaskStore.getState>): Task[] {
  const { filterMode, sortMode, searchQuery, currentCategoryId } = state;

  let result = [...tasks];

  // Category filter
  if (currentCategoryId !== 'all') {
    if (currentCategoryId === null) {
      result = result.filter(t => t.category_id === null);
    } else {
      result = result.filter(t => t.category_id === currentCategoryId);
    }
  }

  // Filter mode
  const todayStr = new Date().toISOString().slice(0, 10);
  switch (filterMode) {
    case 'active':  result = result.filter(t => !t.is_done && !t.is_archived); break;
    case 'done':    result = result.filter(t => t.is_done && !t.is_archived); break;
    case 'today':
      result = result.filter(t =>
        !t.is_archived &&
        (t.deadline_at?.slice(0, 10) === todayStr ||
         t.created_at.slice(0, 10) === todayStr)
      );
      break;
    case 'archive': result = result.filter(t => t.is_archived); break;
    default:        result = result.filter(t => !t.is_archived); break;
  }

  // Search
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    if (q.startsWith('#')) {
      const tag = q.slice(1);
      result = result.filter(t => t.tags.toLowerCase().includes(tag));
    } else {
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      );
    }
  }

  // Sort
  const pinned = result.filter(t => t.is_pinned);
  const rest   = result.filter(t => !t.is_pinned);

  const sorted = (() => {
    switch (sortMode) {
      case 'old':   return rest.sort((a, b) => a.created_at.localeCompare(b.created_at));
      case 'alpha': return rest.sort((a, b) => a.title.localeCompare(b.title));
      case 'undone':return rest.sort((a, b) => Number(a.is_done) - Number(b.is_done));
      case 'manual':return rest.sort((a, b) => a.sort_order - b.sort_order);
      default:      return rest.sort((a, b) => b.created_at.localeCompare(a.created_at));
    }
  })();

  return [...pinned, ...sorted];
}

export function TaskList() {
  const { t } = useTranslation();
  const state = useTaskStore();
  const categories = useCategoryStore(s => s.categories);
  // Tracks the "anchor" task for Shift+click range selection
  const lastSelectedIdRef = useRef<number | null>(null);

  const catMap = useMemo(() => {
    const m: Record<number, { name: string; color: string }> = {};
    for (const c of categories) m[c.id] = c;
    return m;
  }, [categories]);

  const visible = useMemo(() => filterAndSort(state.tasks, state), [
    state.tasks, state.filterMode, state.sortMode, state.searchQuery, state.currentCategoryId,
  ]);

  // Multi-select: Ctrl+A
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyA') {
        const focused = document.activeElement;
        if (focused && (focused.tagName === 'INPUT' || focused.tagName === 'TEXTAREA')) return;
        e.preventDefault();
        state.selectAll(visible.map(t => t.id));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [visible, state.selectAll]);

  const handleSelect = useCallback((task: Task, e: React.MouseEvent) => {
    const ctrl  = e.ctrlKey || e.metaKey;
    const shift = e.shiftKey;

    if (shift) {
      // Range select from anchor to current
      const anchor = lastSelectedIdRef.current;
      const anchorIdx = anchor !== null ? visible.findIndex(t => t.id === anchor) : -1;
      const curIdx = visible.findIndex(t => t.id === task.id);

      const lo = Math.min(anchorIdx < 0 ? curIdx : anchorIdx, curIdx);
      const hi = Math.max(anchorIdx < 0 ? curIdx : anchorIdx, curIdx);
      const rangeIds = visible.slice(lo, hi + 1).map(t => t.id);

      if (ctrl) {
        // Ctrl+Shift: add range to existing selection
        state.addToSelection(rangeIds);
      } else {
        // Shift: replace selection with range
        state.selectAll(rangeIds);
      }
      // Don't move anchor on shift+click — keep it at the original anchor
    } else if (ctrl) {
      // Ctrl: toggle individual item
      state.toggleSelectTask(task.id);
      lastSelectedIdRef.current = task.id;
    } else {
      // Plain click: single select
      state.clearMultiSelect();
      state.selectTask(task.id);
      lastSelectedIdRef.current = task.id;
    }
  }, [visible, state]);

  if (visible.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-2 px-4 text-center">
        <span style={{ fontSize: 32 }}>📝</span>
        <p style={{ color: 'var(--text-sec)', fontSize: 13 }}>{t('tasks.empty')}</p>
        <p style={{ color: 'var(--text-done)', fontSize: 12 }}>{t('tasks.empty_hint')}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-2">
      {visible.map(task => (
        <TaskItem
          key={task.id}
          task={task}
          isSelected={task.id === state.selectedTaskId}
          isMultiSelected={state.selectedTaskIds.includes(task.id)}
          catColor={task.category_id ? catMap[task.category_id]?.color : undefined}
          onSelect={(e) => handleSelect(task, e)}
          onToggleDone={() => state.setDone(task.id, !task.is_done)}
        />
      ))}
    </div>
  );
}

interface TaskItemProps {
  task: Task;
  isSelected: boolean;
  isMultiSelected: boolean;
  catColor?: string;
  onSelect: (e: React.MouseEvent) => void;
  onToggleDone: () => void;
}

function TaskItem({ task, isSelected, isMultiSelected, catColor, onSelect, onToggleDone }: TaskItemProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const isOverdue = task.deadline_at && !task.is_done &&
    new Date(task.deadline_at) < new Date();

  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: DND_TASK,
    item: { id: task.id, title: task.title },
    collect: monitor => ({ isDragging: monitor.isDragging() }),
  }), [task.id, task.title]);

  // F2 starts rename when this task is selected
  useEffect(() => {
    if (!isSelected) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F2' && !isRenaming) {
        e.preventDefault();
        setDraftTitle(task.title);
        setIsRenaming(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isSelected, isRenaming, task.title]);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const confirmRename = () => {
    const trimmed = draftTitle.trim();
    if (trimmed && trimmed !== task.title) {
      useTaskStore.getState().updateFields(task.id, { title: trimmed });
    }
    setIsRenaming(false);
  };

  const cancelRename = () => {
    setIsRenaming(false);
  };

  const highlighted = isSelected || isMultiSelected;

  return (
    <div
      ref={dragRef as any}
      onClick={e => { if (!isRenaming) onSelect(e); }}
      onMouseDown={e => { if (e.shiftKey) e.preventDefault(); }} // prevent text selection on shift+click
      onDoubleClick={e => {
        e.stopPropagation();
        setDraftTitle(task.title);
        setIsRenaming(true);
      }}
      className={`task-card flex items-start gap-2 px-3 py-2.5 cursor-pointer rounded-xl${highlighted ? ' task-card--selected' : ''}${task.is_done ? ' task-card--done' : ''}`}
      style={{
        background: highlighted ? 'var(--card-active-bg)' : 'var(--glass)',
        border: `1px solid ${highlighted ? 'var(--card-active-bdr)' : 'var(--glass-border)'}`,
        boxShadow: isSelected
          ? 'inset 0 1px 0 rgba(10,132,255,0.30), 0 2px 12px rgba(10,132,255,0.10)'
          : isMultiSelected
          ? 'inset 0 1px 0 rgba(10,132,255,0.15)'
          : 'none',
        opacity: isDragging ? 0.3 : task.is_done ? 0.48 : 1,
        cursor: isDragging ? 'grabbing' : 'pointer',
      } as React.CSSProperties}
    >
      {/* Priority strip */}
      {task.priority > 0 && (
        <div
          className="rounded-full mt-1 flex-shrink-0"
          style={{ width: 3, height: 28, background: PRIORITY_COLORS[task.priority] }}
        />
      )}

      {/* Checkbox */}
      <button
        onClick={e => { e.stopPropagation(); onToggleDone(); }}
        className="mt-0.5 rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          width: 17, height: 17,
          border: `1.5px solid ${task.is_done ? 'var(--accent)' : 'var(--glass-border)'}`,
          background: task.is_done ? 'var(--accent)' : 'transparent',
          cursor: 'pointer', fontSize: 9, color: '#fff',
          transition: 'border-color 0.12s, background 0.12s',
        }}
      >
        {task.is_done && '✓'}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          {task.is_pinned && (
            <span style={{ fontSize: 9, color: 'var(--accent)', opacity: 0.8 }}>📌</span>
          )}
          {isRenaming ? (
            <input
              ref={inputRef}
              value={draftTitle}
              onChange={e => setDraftTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); confirmRename(); }
                if (e.key === 'Escape') { e.preventDefault(); cancelRename(); }
                e.stopPropagation();
              }}
              onBlur={confirmRename}
              onClick={e => e.stopPropagation()}
              className="flex-1 min-w-0 text-sm bg-transparent outline-none"
              style={{
                color: 'var(--text)',
                borderBottom: '1px solid var(--accent)',
                fontWeight: 600,
                padding: '0 0 1px 0',
              }}
            />
          ) : (
            <span
              className="truncate text-sm"
              style={{
                color: task.is_done ? 'var(--text-sec)' : 'var(--text)',
                textDecoration: task.is_done ? 'line-through' : 'none',
                fontWeight: highlighted ? 600 : 500,
              }}
            >
              {task.title || <span style={{ color: 'var(--text-done)' }}>Без названия</span>}
            </span>
          )}
        </div>

        {/* Meta row */}
        {!isRenaming && (
          <div className="flex items-center gap-2 mt-0.5 flex-wrap" style={{ opacity: 0.6 }}>
            {task.deadline_at && (
              <span
                className="text-xs"
                style={{ color: isOverdue ? 'var(--danger)' : 'var(--text-sec)', opacity: isOverdue ? 1 : undefined }}
              >
                {task.deadline_at.slice(0, 10)}
              </span>
            )}
            {catColor && (
              <span
                className="rounded-full flex-shrink-0"
                style={{ width: 5, height: 5, background: catColor }}
              />
            )}
            {task.tags && task.tags !== 'tutorial' && task.tags !== 'demo' && (
              <span className="text-xs truncate" style={{ color: 'var(--text-done)' }}>
                {task.tags.split(',')[0].trim() && `#${task.tags.split(',')[0].trim()}`}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
