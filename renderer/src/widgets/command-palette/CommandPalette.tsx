import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Page } from '@/app/App';
import { useTaskStore } from '@/entities/task/store';

interface Action {
  id: string;
  icon: string;
  label: string;
  sub?: string;
  onSelect: () => void;
}

interface Props {
  onClose: () => void;
  onNavigate: (p: Page) => void;
  onNewTask: () => void;
}

export function CommandPalette({ onClose, onNavigate, onNewTask }: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const tasks = useTaskStore(s => s.tasks);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const NAV: Action[] = [
    { id: 'nav-tasks',     icon: '✓',  label: t('nav.tasks'),     sub: t('command_palette.navigate'), onSelect: () => { onNavigate('tasks');     onClose(); } },
    { id: 'nav-calendar',  icon: '📅', label: t('nav.calendar'),  sub: t('command_palette.navigate'), onSelect: () => { onNavigate('calendar');  onClose(); } },
    { id: 'nav-analytics', icon: '📊', label: t('nav.analytics'), sub: t('command_palette.navigate'), onSelect: () => { onNavigate('analytics'); onClose(); } },
    { id: 'nav-finance',   icon: '💰', label: t('nav.finance'),   sub: t('command_palette.navigate'), onSelect: () => { onNavigate('finance');   onClose(); } },
    { id: 'nav-settings',  icon: '⚙️', label: t('nav.settings'),  sub: t('command_palette.navigate'), onSelect: () => { onNavigate('settings'); onClose(); } },
    { id: 'new-task',      icon: '＋', label: t('command_palette.new_task'), sub: 'Ctrl+N', onSelect: () => { onNewTask(); onClose(); } },
  ];

  const taskActions: Action[] = tasks.slice(0, 30).map(tk => ({
    id: `task-${tk.id}`,
    icon: tk.is_done ? '✅' : '○',
    label: tk.title,
    sub: t('command_palette.task_label'),
    onSelect: () => {
      onNavigate('tasks');
      useTaskStore.getState().selectTask(tk.id);
      onClose();
    },
  }));

  const all = [...NAV, ...taskActions];
  const q = query.toLowerCase().trim();
  const filtered = q ? all.filter(a => a.label.toLowerCase().includes(q) || (a.sub?.toLowerCase().includes(q))) : all;

  useEffect(() => setIdx(0), [query]);

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(i => Math.min(i + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter')     { filtered[idx]?.onSelect(); }
    if (e.key === 'Escape')    { onClose(); }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '14vh',
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(6px)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: 560, maxHeight: '60vh',
        display: 'flex', flexDirection: 'column',
        background: 'var(--bg-panel)',
        backdropFilter: 'blur(32px) saturate(1.6)',
        WebkitBackdropFilter: 'blur(32px) saturate(1.6)',
        border: '1px solid var(--glass-border)',
        borderTop: '1px solid var(--glass-border-top)',
        borderRadius: 16,
        boxShadow: '0 24px 64px rgba(0,0,0,0.55)',
        overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--separator)' }}>
          <span style={{ fontSize: 16, opacity: 0.5 }}>⌕</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder={t('command_palette.placeholder')}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--text)', fontSize: 15,
            }}
          />
          <kbd style={{ fontSize: 10, color: 'var(--text-sec)', background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: 4, padding: '2px 5px' }}>Esc</kbd>
        </div>

        <div style={{ overflowY: 'auto', padding: '6px 8px' }}>
          {filtered.length === 0 ? (
            <p style={{ padding: '20px', textAlign: 'center', color: 'var(--text-sec)', fontSize: 13 }}>{t('command_palette.no_results')}</p>
          ) : filtered.map((a, i) => (
            <div
              key={a.id}
              onClick={a.onSelect}
              onMouseEnter={() => setIdx(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '9px 10px', borderRadius: 10, cursor: 'pointer',
                background: i === idx ? 'var(--glass-hover)' : 'transparent',
                transition: 'background 0.1s',
              }}
            >
              <span style={{ fontSize: 16, width: 22, textAlign: 'center', flexShrink: 0 }}>{a.icon}</span>
              <span style={{ flex: 1, fontSize: 14, color: 'var(--text)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {a.label}
              </span>
              {a.sub && <span style={{ fontSize: 11, color: 'var(--text-sec)', flexShrink: 0 }}>{a.sub}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
