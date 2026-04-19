import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTaskStore } from '@/entities/task/store';

export function BulkActionBar() {
  const { t } = useTranslation();
  const { selectedTaskIds, bulkSetDone, bulkDelete, clearMultiSelect } = useTaskStore();

  if (selectedTaskIds.length < 2) return null;

  const btn = (label: string, onClick: () => void, danger?: boolean) => (
    <button
      onClick={onClick}
      className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
      style={{
        border: 'none', cursor: 'pointer',
        background: danger ? 'rgba(255,69,58,0.18)' : 'var(--glass)',
        color: danger ? 'var(--danger)' : 'var(--text)',
      }}
    >
      {label}
    </button>
  );

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 mx-2 mb-1 rounded-xl"
      style={{
        background: 'var(--card-active-bg)',
        border: '1px solid var(--card-active-bdr)',
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 12, color: 'var(--text-sec)', flex: 1 }}>
        {selectedTaskIds.length} {t('tasks.selected', { count: selectedTaskIds.length })}
      </span>
      {btn(t('tasks.bulk_done'),   () => bulkSetDone(selectedTaskIds, true))}
      {btn(t('tasks.bulk_undone'), () => bulkSetDone(selectedTaskIds, false))}
      {btn(t('tasks.bulk_delete'), () => bulkDelete(selectedTaskIds), true)}
      <button
        onClick={clearMultiSelect}
        style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'var(--text-sec)', fontSize: 16, lineHeight: 1, padding: '0 2px',
        }}
      >
        ×
      </button>
    </div>
  );
}
