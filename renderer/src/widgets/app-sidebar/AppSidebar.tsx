import React, { useEffect, useRef, useState } from 'react';
import { useDrop } from 'react-dnd';
import type { Page } from '@/app/App';
import { useTranslation } from 'react-i18next';
import { DND_TASK } from '@/widgets/task-sidebar/TaskList';

interface Props {
  currentPage: Page;
  onNavigate: (p: Page) => void;
}

const NAV_ITEMS: { id: Page; icon: React.ReactNode; labelKey: string }[] = [
  {
    id: 'tasks', labelKey: 'nav.tasks',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="2" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.5"/>
        <polyline points="5.5,9 7.5,11 12,6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'calendar', labelKey: 'nav.calendar',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="3.5" width="14" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="6" y1="2" x2="6" y2="5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="12" y1="2" x2="12" y2="5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="2" y1="8" x2="16" y2="8" stroke="currentColor" strokeWidth="1.2"/>
        <rect x="5" y="10" width="2.5" height="2.5" rx="0.5" fill="currentColor" opacity="0.7"/>
        <rect x="9.5" y="10" width="2.5" height="2.5" rx="0.5" fill="currentColor" opacity="0.5"/>
      </svg>
    ),
  },
  {
    id: 'analytics', labelKey: 'nav.analytics',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="10" width="3.5" height="6" rx="1" fill="currentColor" opacity="0.6"/>
        <rect x="7.25" y="6.5" width="3.5" height="9.5" rx="1" fill="currentColor" opacity="0.8"/>
        <rect x="12.5" y="3" width="3.5" height="13" rx="1" fill="currentColor"/>
      </svg>
    ),
  },
  {
    id: 'finance', labelKey: 'nav.finance',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M9 4.5V5.8M9 12.2V13.5M6.5 7.2C6.5 6.3 7.1 5.8 9 5.8C10.9 5.8 11.5 6.7 11.5 7.5C11.5 9.2 6.5 8.8 6.5 10.5C6.5 11.5 7.4 12.2 9 12.2C10.6 12.2 11.5 11.5 11.5 10.8"
          stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
];

const DRAG_NAV_DELAY = 600; // ms to hover before switching page

export function AppSidebar({ currentPage, onNavigate }: Props) {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState<Page | null>(null);

  function NavItem({ id, icon, label }: { id: Page; icon: React.ReactNode; label: string }) {
    const active  = currentPage === id;
    const isHov   = hovered === id;
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [{ isDragOver }, dropRef] = useDrop(() => ({
      accept: DND_TASK,
      collect: monitor => ({ isDragOver: monitor.isOver() }),
    }), []);

    // Auto-navigate when dragging a task hovers this nav item
    useEffect(() => {
      if (isDragOver && id !== currentPage) {
        timerRef.current = setTimeout(() => onNavigate(id), DRAG_NAV_DELAY);
      } else {
        if (timerRef.current) clearTimeout(timerRef.current);
      }
      return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [isDragOver]);

    const dragHighlight = isDragOver && id !== currentPage;

    return (
      <button
        ref={dropRef as any}
        onClick={() => onNavigate(id)}
        onMouseEnter={() => setHovered(id)}
        onMouseLeave={() => setHovered(null)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          padding: '8px 12px',
          border: dragHighlight ? '1px dashed var(--accent)' : '1px solid transparent',
          borderRadius: 10,
          cursor: 'pointer',
          background: active
            ? 'var(--accent)'
            : dragHighlight
              ? 'var(--card-active-bg)'
              : isHov ? 'var(--glass-hover)' : 'transparent',
          color: active ? '#fff' : 'var(--text)',
          fontSize: 13,
          fontWeight: active ? 600 : 400,
          letterSpacing: 0.1,
          transition: 'all 0.14s ease',
          textAlign: 'left',
          flexShrink: 0,
          boxShadow: active ? '0 2px 10px var(--accent-glow)' : 'none',
          opacity: 1,
        }}
      >
        <span style={{ flexShrink: 0, opacity: active ? 1 : 0.8 }}>{icon}</span>
        <span style={{ flex: 1 }}>{label}</span>
        {dragHighlight && (
          <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 700, opacity: 0.8 }}>→</span>
        )}
      </button>
    );
  }

  function SettingsItem() {
    const active = currentPage === 'settings';
    const isHov  = hovered === 'settings';
    return (
      <button
        onClick={() => onNavigate('settings')}
        onMouseEnter={() => setHovered('settings')}
        onMouseLeave={() => setHovered(null)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          padding: '8px 12px',
          border: 'none',
          borderRadius: 10,
          cursor: 'pointer',
          background: active ? 'var(--accent)' : isHov ? 'var(--glass-hover)' : 'transparent',
          color: active ? '#fff' : 'var(--text)',
          fontSize: 13,
          fontWeight: active ? 600 : 400,
          transition: 'all 0.14s ease',
          textAlign: 'left',
          flexShrink: 0,
          boxShadow: active ? '0 2px 10px var(--accent-glow)' : 'none',
          opacity: 1,
        }}
      >
        <span style={{ flexShrink: 0, opacity: active ? 1 : 0.8 }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M9 1.5V3M9 15V16.5M1.5 9H3M15 9H16.5M3.4 3.4L4.4 4.4M13.6 13.6L14.6 14.6M14.6 3.4L13.6 4.4M4.4 13.6L3.4 14.6"
              stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </span>
        <span>{t('nav.settings')}</span>
      </button>
    );
  }

  return (
    <aside
      data-tour="sidebar"
      style={{
        width: 200,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        padding: '10px 8px',
        gap: 2,
        backdropFilter: 'var(--blur-sm)',
        WebkitBackdropFilter: 'var(--blur-sm)',
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--glass-border)',
      }}
    >
      {/* Main nav */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {NAV_ITEMS.map(item => (
          <NavItem key={item.id} id={item.id} icon={item.icon} label={t(item.labelKey)} />
        ))}
      </div>

      {/* Separator */}
      <div style={{ height: 1, background: 'var(--glass-border)', margin: '4px 8px 6px' }} />

      {/* Settings */}
      <SettingsItem />
    </aside>
  );
}
