import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCategoryStore } from '@/entities/category/store';
import { useTaskStore } from '@/entities/task/store';

export function CategoryBar() {
  const { t } = useTranslation();
  const categories = useCategoryStore(s => s.categories);
  const { currentCategoryId, setCategoryFilter } = useTaskStore();

  const active = currentCategoryId;

  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1.5 overflow-x-auto"
      style={{ background: 'var(--bg-panel)', borderBottom: '1px solid var(--glass-border)' }}
    >
      {/* "All" chip */}
      <button
        onClick={() => setCategoryFilter('all')}
        className="flex items-center gap-1 px-3 py-0.5 rounded-full text-xs whitespace-nowrap transition-all"
        style={{
          border: 'none', cursor: 'pointer',
          background: active === 'all' ? 'var(--accent)' : 'var(--glass)',
          color: active === 'all' ? '#fff' : 'var(--text-sec)',
        }}
      >
        {t('tasks.filter_all')}
      </button>

      {/* "No category" chip */}
      <button
        onClick={() => setCategoryFilter(null)}
        className="flex items-center gap-1 px-3 py-0.5 rounded-full text-xs whitespace-nowrap transition-all"
        style={{
          border: 'none', cursor: 'pointer',
          background: active === null ? 'var(--accent)' : 'var(--glass)',
          color: active === null ? '#fff' : 'var(--text-sec)',
        }}
      >
        {t('tasks.no_category')}
      </button>

      {/* Category chips */}
      {categories.map(cat => (
        <button
          key={cat.id}
          onClick={() => setCategoryFilter(cat.id)}
          className="flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs whitespace-nowrap transition-all"
          style={{
            border: 'none', cursor: 'pointer',
            background: active === cat.id ? cat.color : 'var(--glass)',
            color: active === cat.id ? '#fff' : 'var(--text)',
          }}
        >
          <span
            className="rounded-full"
            style={{ width: 8, height: 8, background: cat.color, flexShrink: 0 }}
          />
          {cat.name}
          {cat.task_count > 0 && (
            <span style={{ opacity: 0.7 }}>{cat.task_count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
