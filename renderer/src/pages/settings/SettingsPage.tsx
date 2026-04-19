import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme, type Theme } from '@/app/providers/ThemeProvider';
import { ipc } from '@/shared/api/ipc';
import { useTaskStore } from '@/entities/task/store';
import { useCategoryStore } from '@/entities/category/store';
import { format, subDays } from 'date-fns';
import { NOTIFICATION_SOUNDS, playNotificationSound } from '@/shared/sounds';

const THEMES: { id: Theme; icon: string; labelKey: string }[] = [
  { id: 'dark',  icon: '🌙', labelKey: 'settings.dark'  },
  { id: 'light', icon: '☀️', labelKey: 'settings.light' },
];

interface Props {
  onStartTour?: () => void;
}

export function SettingsPage({ onStartTour }: Props) {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [archiveDays, setArchiveDays] = useState(30);
  const [archiveMsg, setArchiveMsg] = useState<string | null>(null);
  const [dataMsg, setDataMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [notifSound, setNotifSound]     = useState('toXo_default');

  useEffect(() => {
    ipc.settings.get('archive_after', 30).then(v => setArchiveDays(v as number));
    ipc.settings.get('notifications_enabled', true).then(v => setNotifEnabled(v as boolean));
    ipc.settings.get('notification_sound', 'toXo_default').then(v => setNotifSound((v as string) || 'toXo_default'));
  }, []);

  const flash = (setter: (m: string | null) => void, msg: string) => {
    setter(msg);
    setTimeout(() => setter(null), 3000);
  };

  async function changeLang(lang: string) {
    await ipc.settings.set('language', lang);
    await i18n.changeLanguage(lang);
  }

  async function handleArchiveNow() {
    setBusy(true);
    try {
      const cutoff = format(subDays(new Date(), archiveDays), 'yyyy-MM-dd');
      const count = await ipc.tasks.archiveCompleted(cutoff);
      flash(setArchiveMsg, `${count} ${t('settings.archive_now_done')}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleClearArchive() {
    if (!window.confirm(t('settings.clear_archive_confirm'))) return;
    await ipc.tasks.clearArchive();
    flash(setArchiveMsg, t('settings.clear_archive_done'));
  }

  async function handleExportJson() {
    const res = await ipc.shell.showSaveDialog({
      filters: [{ name: 'JSON', extensions: ['json'] }],
      defaultPath: 'tasks.json',
    });
    if (!res.canceled && res.filePath) await ipc.tasks.exportJson(res.filePath);
  }

  async function handleExportCsv() {
    const res = await ipc.shell.showSaveDialog({
      filters: [{ name: 'CSV', extensions: ['csv'] }],
      defaultPath: 'tasks.csv',
    });
    if (!res.canceled && res.filePath) await ipc.tasks.exportCsv(res.filePath);
  }

  async function handleImportJson() {
    const res = await ipc.shell.showOpenDialog({
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (!res.canceled && res.filePaths[0]) {
      const count = await ipc.tasks.importJson(res.filePaths[0]);
      flash(setDataMsg, `${count} ${t('settings.import_done')}`);
    }
  }

  function notifyFinanceReload() {
    window.dispatchEvent(new CustomEvent('finance:reload'));
  }

  async function handleLoadDemo() {
    setBusy(true);
    try {
      await ipc.tasks.loadDemo();
      await Promise.all([
        useTaskStore.getState().fetchAll(),
        useCategoryStore.getState().fetchAll(),
      ]);
      notifyFinanceReload();
      flash(setDataMsg, t('settings.load_demo_done'));
    } finally {
      setBusy(false);
    }
  }

  async function handleClearAll() {
    if (!window.confirm(t('settings.clear_all_confirm'))) return;
    setBusy(true);
    try {
      await ipc.tasks.clearAll();
      await Promise.all([
        useTaskStore.getState().fetchAll(),
        useCategoryStore.getState().fetchAll(),
      ]);
      notifyFinanceReload();
      flash(setDataMsg, t('settings.clear_all_done'));
    } finally {
      setBusy(false);
    }
  }

  const shortcuts = [
    { keys: 'Ctrl+N',   label: t('settings.shortcut_new') },
    { keys: 'Ctrl+K',   label: t('settings.shortcut_palette') },
    { keys: 'Ctrl+Z',   label: t('settings.shortcut_undo') },
    { keys: 'Delete',   label: t('settings.shortcut_delete') },
    { keys: 'Escape',   label: t('settings.shortcut_escape') },
    { keys: 'Ctrl+D',   label: t('settings.shortcut_duplicate') },
    { keys: 'Ctrl+P',   label: t('settings.shortcut_pin') },
    { keys: 'Ctrl+1–3', label: t('settings.shortcut_priority') },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto items-center py-6 px-4">
    <div className="flex flex-col gap-5 w-full" style={{ maxWidth: 620 }}>
      <h1 className="text-xl font-bold">{t('settings.title')}</h1>

      {/* ── Appearance ── */}
      <SettingsSection title={t('settings.appearance')}>
        <SubLabel>{t('settings.theme')}</SubLabel>
        <div className="flex gap-3 flex-wrap">
          {THEMES.map(th => (
            <button
              key={th.id}
              onClick={() => setTheme(th.id)}
              className="flex flex-col items-center gap-2 rounded-xl px-5 py-3 transition-all"
              style={{
                border: `2px solid ${theme === th.id ? 'var(--accent)' : 'var(--glass-border)'}`,
                background: theme === th.id ? 'var(--accent-glow)' : 'var(--glass)',
                backdropFilter: 'var(--blur-sm)',
                cursor: 'pointer',
                color: 'var(--text)',
              } as React.CSSProperties}
            >
              <span style={{ fontSize: 24 }}>{th.icon}</span>
              <span className="text-xs font-medium">{t(th.labelKey)}</span>
            </button>
          ))}
        </div>

        <p style={{ color: 'var(--text)', fontSize: 12, fontWeight: 600, marginTop: 12 }}>{t('settings.language')}</p>
        <div className="flex gap-3">
          {(['ru', 'en'] as const).map(lang => (
            <button
              key={lang}
              onClick={() => changeLang(lang)}
              className="flex items-center gap-2 rounded-xl px-4 py-2 transition-all"
              style={{
                border: `2px solid ${i18n.language === lang ? 'var(--accent)' : 'var(--glass-border)'}`,
                background: i18n.language === lang ? 'var(--accent-glow)' : 'var(--glass)',
                cursor: 'pointer',
                color: 'var(--text)',
                fontSize: 13,
                fontWeight: i18n.language === lang ? 600 : 400,
              }}
            >
              {lang === 'ru' ? 'RU' : 'GB'}
            </button>
          ))}
        </div>
      </SettingsSection>

      {/* ── Tasks ── */}
      <SettingsSection title={t('settings.tasks_section')}>
        <div className="flex items-center gap-3 flex-wrap">
          <span style={{ color: 'var(--text)', fontSize: 13 }}>{t('settings.archive_after')}</span>
          <input
            type="number"
            min={1}
            max={365}
            value={archiveDays}
            onChange={e => {
              const v = Math.max(1, parseInt(e.target.value) || 30);
              setArchiveDays(v);
              ipc.settings.set('archive_after', v);
            }}
            style={{
              width: 60,
              textAlign: 'center',
              padding: '4px 8px',
              background: 'var(--glass)',
              border: '1px solid var(--glass-border)',
              borderRadius: 8,
              color: 'var(--text)',
              fontSize: 13,
            }}
          />
          <span style={{ color: 'var(--text)', fontSize: 13 }}>{t('settings.archive_after_days')}</span>
        </div>

        {archiveMsg && (
          <p style={{ color: 'var(--success)', fontSize: 12, marginTop: 4 }}>{archiveMsg}</p>
        )}

        <div className="flex gap-3 flex-wrap mt-2">
          <ActionBtn onClick={handleArchiveNow} disabled={busy}>
            🗃 {t('settings.archive_now')}
          </ActionBtn>
          <ActionBtn onClick={handleClearArchive} danger>
            🗑 {t('settings.clear_archive')}
          </ActionBtn>
        </div>
      </SettingsSection>

      {/* ── Data ── */}
      <SettingsSection data-tour="settings-data" title={t('settings.data_section')}>
        {dataMsg && (
          <p style={{ color: 'var(--success)', fontSize: 12, marginBottom: 4 }}>{dataMsg}</p>
        )}
        <div className="flex gap-3 flex-wrap">
          <ActionBtn onClick={() => onStartTour?.()}>🎯 {t('settings.start_tour')}</ActionBtn>
          <ActionBtn onClick={handleExportJson}>📤 {t('settings.export_json')}</ActionBtn>
          <ActionBtn onClick={handleExportCsv}>📊 {t('settings.export_csv')}</ActionBtn>
          <ActionBtn onClick={handleImportJson}>📥 {t('settings.import_json')}</ActionBtn>
          <ActionBtn onClick={handleLoadDemo} disabled={busy}>🎲 {t('settings.load_demo')}</ActionBtn>
          <ActionBtn onClick={handleClearAll} danger>🗑 {t('settings.clear_all')}</ActionBtn>
        </div>
      </SettingsSection>

      {/* ── Notifications ── */}
      <SettingsSection title={t('settings.notifications_section')}>
        {/* Enable toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p style={{ color: 'var(--text)', fontSize: 13, fontWeight: 500 }}>
              {t('settings.notifications_enabled')}
            </p>
            <p style={{ color: 'var(--text)', fontSize: 12, marginTop: 2 }}>
              {t('settings.notifications_enabled_hint')}
            </p>
          </div>
          <button
            onClick={async () => {
              const next = !notifEnabled;
              setNotifEnabled(next);
              await ipc.settings.set('notifications_enabled', next);
            }}
            style={{
              width: 44, height: 24, borderRadius: 12, border: 'none',
              background: notifEnabled ? 'var(--accent)' : 'var(--glass-border)',
              cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0,
            }}
          >
            <span style={{
              position: 'absolute', top: 3, width: 18, height: 18,
              left: notifEnabled ? 22 : 4,
              background: '#fff', borderRadius: '50%', transition: 'left 0.2s',
            }} />
          </button>
        </div>

        {/* Sound picker */}
        <div style={{ opacity: notifEnabled ? 1 : 0.45, transition: 'opacity 0.2s', pointerEvents: notifEnabled ? 'auto' : 'none' }}>
          <p style={{ color: 'var(--text)', fontSize: 12, marginBottom: 8 }}>
            {t('settings.notification_sound')}
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <SoundSelect
              value={notifSound}
              onChange={async key => {
                setNotifSound(key);
                await ipc.settings.set('notification_sound', key);
              }}
            />
            <ActionBtn onClick={() => playNotificationSound(notifSound)}>
              ▶ {t('settings.notification_preview')}
            </ActionBtn>
          </div>
        </div>
      </SettingsSection>

      {/* ── Keyboard shortcuts ── */}
      <SettingsSection title={t('settings.shortcuts_section')}>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          {shortcuts.map(s => (
            <div key={s.keys} className="flex items-center justify-between gap-4">
              <span style={{ color: 'var(--text)', fontSize: 13 }}>{s.label}</span>
              <Kbd>{s.keys}</Kbd>
            </div>
          ))}
        </div>
      </SettingsSection>

      {/* ── About ── */}
      <SettingsSection title={t('settings.about_section')}>
        <div className="flex items-center gap-4">
          <img
            src="./app_icon.png"
            alt="toXo"
            style={{ width: 52, height: 52, borderRadius: 14, flexShrink: 0 }}
          />
          <div>
            <p className="font-bold text-base" style={{ color: 'var(--text)' }}>toXo</p>
            <p style={{ color: 'var(--text)', fontSize: 13 }}>{t('settings.version')} 2.0</p>
            <p style={{ color: 'var(--text)', fontSize: 12, marginTop: 2, opacity: 0.6 }}>
              Electron · React · TypeScript
            </p>
            <p style={{ color: 'var(--text)', fontSize: 12, marginTop: 6 }}>
              by{' '}
              <a
                href="https://github.com/TheOverforge"
                target="_blank"
                rel="noreferrer"
                onClick={e => { e.preventDefault(); window.open('https://github.com/TheOverforge'); }}
                style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}
              >
                TheOverforge
              </a>
            </p>
          </div>
        </div>
      </SettingsSection>
    </div>
    </div>
  );
}

function SettingsSection({ title, children, ...rest }: { title: string; children: React.ReactNode; [k: string]: any }) {
  return (
    <section className="glass-card flex flex-col gap-3 p-5" {...rest}>
      <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text)' }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function SubLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <p style={{ color: 'var(--text)', fontSize: 12, ...style }}>{children}</p>
  );
}

function ActionBtn({
  children, onClick, disabled, danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm transition-all"
      style={{
        background: danger ? 'rgba(255,69,58,0.10)' : 'var(--glass)',
        border: `1px solid ${danger ? 'rgba(255,69,58,0.28)' : 'var(--glass-border)'}`,
        color: danger ? 'var(--danger)' : 'var(--text)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {children}
    </button>
  );
}

function SoundSelect({ value, onChange }: { value: string; onChange: (key: string) => void }) {
  const [open, setOpen] = useState(false);
  const current = NOTIFICATION_SOUNDS.find(s => s.key === value);

  return (
    <div style={{ flex: 1, minWidth: 180 }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', height: 34, padding: '0 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--glass)', border: '1px solid var(--glass-border)',
          borderRadius: open ? '10px 10px 0 0' : 10,
          color: 'var(--text)', fontSize: 13, cursor: 'pointer',
        }}
      >
        <span>{current?.label ?? value}</span>
        <span style={{ opacity: 0.5, fontSize: 10, marginLeft: 6, transition: 'transform 0.15s', display: 'inline-block', transform: open ? 'rotate(180deg)' : 'none' }}>▾</span>
      </button>

      {/* Inline list — pushes content below down */}
      {open && (
        <div style={{
          background: 'var(--glass)',
          backdropFilter: 'var(--blur-lg)',
          WebkitBackdropFilter: 'var(--blur-lg)',
          border: '1px solid var(--glass-border)',
          borderTop: 'none',
          borderRadius: '0 0 10px 10px',
          overflow: 'hidden',
        }}>
          {NOTIFICATION_SOUNDS.map((s, i) => (
            <button
              key={s.key}
              onClick={() => { onChange(s.key); setOpen(false); }}
              style={{
                display: 'block', width: '100%', padding: '9px 14px',
                textAlign: 'left', border: 'none', cursor: 'pointer',
                background: s.key === value ? 'var(--accent-soft)' : 'transparent',
                color: s.key === value ? 'var(--accent)' : 'var(--text)',
                fontSize: 13, fontWeight: s.key === value ? 600 : 400,
                borderBottom: i < NOTIFICATION_SOUNDS.length - 1
                  ? '1px solid var(--separator)' : 'none',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => {
                if (s.key !== value) (e.currentTarget as HTMLElement).style.background = 'var(--glass-hover)';
              }}
              onMouseLeave={e => {
                if (s.key !== value) (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      style={{
        background: 'var(--glass)',
        border: '1px solid var(--glass-border)',
        borderBottom: '2px solid var(--glass-border)',
        borderRadius: 6,
        padding: '2px 7px',
        fontSize: 11,
        fontFamily: 'monospace',
        color: 'var(--text)',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {children}
    </kbd>
  );
}
