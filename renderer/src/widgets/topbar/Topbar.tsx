import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTaskStore, type FilterMode, type SortMode } from '@/entities/task/store';

interface Props {
  onNewTask: () => void;
}

const FILTERS: { id: FilterMode; labelKey: string }[] = [
  { id: 'all',     labelKey: 'tasks.filter_all'     },
  { id: 'active',  labelKey: 'tasks.filter_active'  },
  { id: 'done',    labelKey: 'tasks.filter_done'    },
  { id: 'today',   labelKey: 'tasks.filter_today'   },
  { id: 'archive', labelKey: 'tasks.filter_archive' },
];

export function Topbar({ onNewTask }: Props) {
  const { t } = useTranslation();
  const { filterMode, sortMode, searchQuery, setFilter, setSort, setSearch } = useTaskStore();

  return (
    <div
      className="flex flex-col gap-2 px-3 pt-3 pb-2 border-b"
      style={{ background: 'var(--bg-panel)', borderColor: 'var(--glass-border)' }}
    >
      {/* Top row: search + new button */}
      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('tasks.search')}
          className="flex-1 rounded-lg px-3 py-1.5 text-sm outline-none"
          style={{
            background: 'var(--bg-combo)',
            color: 'var(--text)',
            border: '1px solid var(--glass-border)',
          }}
        />
        <button
          data-tour="new-task"
          onClick={onNewTask}
          title={`${t('tasks.new_task')} (${t('tasks.new_task_hint')})`}
          className="flex items-center justify-center rounded-lg text-white font-bold"
          style={{
            width: 30, height: 30,
            background: 'var(--accent)',
            border: 'none',
            cursor: 'pointer',
            fontSize: 20,
            lineHeight: 1,
          }}
        >
          +
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex gap-1 overflow-x-auto pb-0.5">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className="px-3 py-0.5 rounded-full text-xs whitespace-nowrap transition-all"
            style={{
              border: 'none',
              cursor: 'pointer',
              background: filterMode === f.id ? 'var(--accent)' : 'var(--glass)',
              color: filterMode === f.id ? '#fff' : 'var(--text-sec)',
            }}
          >
            {t(f.labelKey)}
          </button>
        ))}
      </div>
    </div>
  );
}
