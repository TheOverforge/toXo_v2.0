import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useTaskStore } from '@/entities/task/store';
import { useCategoryStore } from '@/entities/category/store';
import { TaskList } from '@/widgets/task-sidebar/TaskList';
import { BulkActionBar } from '@/widgets/task-sidebar/BulkActionBar';
import { TaskEditor } from '@/widgets/task-editor/TaskEditor';
import { Topbar } from '@/widgets/topbar/Topbar';
import { CategoryBar } from '@/features/categories/manage-categories/CategoryBar';
import { useHistoryStore } from '@/shared/lib/undoRedo';
import { ipc } from '@/shared/api/ipc';

export function TasksPage() {
  const { t } = useTranslation();
  const { selectedTaskId, fetchAll, createTask } = useTaskStore();
  const undo = useHistoryStore(s => s.undo);
  const redo = useHistoryStore(s => s.redo);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isEditing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (e.ctrlKey && e.code === 'KeyN' && !isEditing) { e.preventDefault(); handleNewTask(); }

      if (!isEditing) {
        if (e.ctrlKey && e.code === 'KeyZ' && !e.shiftKey) { e.preventDefault(); void undo(); }
        if ((e.ctrlKey && e.code === 'KeyZ' && e.shiftKey) || (e.ctrlKey && e.code === 'KeyY')) {
          e.preventDefault(); void redo();
        }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Tray "New task" action
  useEffect(() => {
    const unsub = ipc.on('tray:newTask', () => handleNewTask());
    return () => unsub();
  }, []);

  async function handleNewTask() {
    const catId = useTaskStore.getState().currentCategoryId;
    const id = await createTask('', '', typeof catId === 'number' ? catId : undefined);
    useTaskStore.getState().selectTask(id);
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left panel: search + filters + task list */}
      <div
        className="flex flex-col border-r overflow-hidden"
        style={{ width: 300, flexShrink: 0, borderColor: 'var(--glass-border)', background: 'var(--bg-panel)' }}
      >
        <Topbar onNewTask={handleNewTask} />
        <div data-tour="filter-bar">
          <CategoryBar />
        </div>
        <div data-tour="task-list" className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <BulkActionBar />
          <TaskList />
        </div>
      </div>

      {/* Right panel: editor */}
      <div data-tour="task-editor" className="flex-1 min-w-0 overflow-hidden">
        {selectedTaskId != null ? (
          <TaskEditor taskId={selectedTaskId} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p style={{ color: 'var(--text-sec)', fontSize: 14 }}>
              {t('tasks.select_hint')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
