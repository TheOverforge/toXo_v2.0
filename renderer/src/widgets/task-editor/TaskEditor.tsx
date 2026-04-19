import React, { useEffect, useRef, useState } from 'react';
import {
  startOfMonth, endOfMonth, eachDayOfInterval, format, isToday,
  addMonths, subMonths, isSameDay,
} from 'date-fns';
import { ru as ruLocale } from 'date-fns/locale';
import { useEditor, EditorContent } from '@tiptap/react';
import { Extension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { useTranslation } from 'react-i18next';
import { useTaskStore } from '@/entities/task/store';
import { useCategoryStore } from '@/entities/category/store';
import type { Subtask } from '@/entities/task/model';
import { ipc } from '@/shared/api/ipc';

// ── Custom Tiptap extensions ──────────────────────────────────────────────────
const FontSizeExtension = Extension.create({
  name: 'fontSize',
  addOptions() { return { types: ['textStyle'] }; },
  addGlobalAttributes() {
    return [{ types: this.options.types, attributes: {
      fontSize: {
        default: null,
        parseHTML: (el: HTMLElement) => el.style.fontSize || null,
        renderHTML: (attrs: Record<string, string | null>) =>
          attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {},
      },
    }}];
  },
});

const FontFamilyExtension = Extension.create({
  name: 'fontFamily',
  addOptions() { return { types: ['textStyle'] }; },
  addGlobalAttributes() {
    return [{ types: this.options.types, attributes: {
      fontFamily: {
        default: null,
        parseHTML: (el: HTMLElement) => el.style.fontFamily || null,
        renderHTML: (attrs: Record<string, string | null>) =>
          attrs.fontFamily ? { style: `font-family: ${attrs.fontFamily}` } : {},
      },
    }}];
  },
});

// ── Format toolbar ────────────────────────────────────────────────────────────
const FONTS = [
  { label: 'Авто',  value: '' },
  { label: 'Sans',  value: 'ui-sans-serif, system-ui, sans-serif' },
  { label: 'Serif', value: 'Georgia, "Times New Roman", serif' },
  { label: 'Mono',  value: '"JetBrains Mono", "Fira Code", monospace' },
];
const SIZES = ['10', '12', '14', '16', '18', '20', '24', '28', '32'];

function ToolBtn({ onClick, active, title, children }: {
  onClick: () => void; active?: boolean; title?: string; children: React.ReactNode;
}) {
  return (
    <button
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      title={title}
      style={{
        background: active ? 'var(--accent)' : 'transparent',
        color: active ? '#fff' : 'var(--text)',
        border: 'none', cursor: 'pointer', borderRadius: 5,
        padding: '3px 7px', fontSize: 13, fontWeight: 700, lineHeight: '1.4',
        transition: 'background 0.1s', opacity: active ? 1 : 0.7,
      }}
    >
      {children}
    </button>
  );
}

function FmtDivider() {
  return <div style={{ width: 1, height: 14, background: 'var(--separator)', margin: '0 2px', flexShrink: 0 }} />;
}

// ── Color picker ──────────────────────────────────────────────────────────────
const PALETTE: string[][] = [
  ['#000000','#1c1c1c','#3d3d3d','#5e5e5e','#808080','#a0a0a0','#c0c0c0','#e0e0e0','#f0f0f0','#ffffff'],
  ['#b71c1c','#d32f2f','#f44336','#ff7043','#ff9800','#ffc107','#ffeb3b','#afb42b','#827717','#4e342e'],
  ['#1b5e20','#2e7d32','#43a047','#66bb6a','#26a69a','#00838f','#0097a7','#006064','#006064','#00695c'],
  ['#0d47a1','#1565c0','#1976d2','#42a5f5','#5c6bc0','#3f51b5','#7e57c2','#9c27b0','#ad1457','#880e4f'],
  ['#ffcdd2','#ffe0b2','#fff9c4','#dcedc8','#b2dfdb','#b3e5fc','#bbdefb','#c5cae9','#e1bee7','#f8bbd0'],
];

function ColorSwatch({ color, size = 20, onClick, onRightClick }: {
  color: string; size?: number;
  onClick: () => void;
  onRightClick?: (e: React.MouseEvent) => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      onContextMenu={e => { e.preventDefault(); onRightClick?.(e); }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={color}
      style={{
        width: size, height: size, borderRadius: 4, border: 'none', cursor: 'pointer',
        background: color, flexShrink: 0,
        transform: hov ? 'scale(1.18)' : 'scale(1)', transition: 'transform 0.1s',
        outline: hov ? `2px solid ${color}` : '1px solid rgba(255,255,255,0.12)',
        outlineOffset: 1,
      }}
    />
  );
}

function ColorPickerPopup({ currentColor, onSelect }: {
  currentColor?: string;
  onSelect: (color: string | null) => void;
}) {
  const { t } = useTranslation();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recent, setRecent]       = useState<string[]>([]);
  const [hex, setHex]             = useState(currentColor ?? '#7c6aff');
  const nativeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      ipc.settings.get('color_favorites', []),
      ipc.settings.get('color_recent', []),
    ]).then(([fav, rec]) => {
      if (Array.isArray(fav)) setFavorites(fav as string[]);
      if (Array.isArray(rec)) setRecent(rec as string[]);
    });
  }, []);

  function pick(color: string) {
    const next = [color, ...recent.filter(c => c !== color)].slice(0, 12);
    setRecent(next);
    ipc.settings.set('color_recent', next);
    setHex(color);
    onSelect(color);
  }

  function removeRecent(color: string) {
    const next = recent.filter(c => c !== color);
    setRecent(next);
    ipc.settings.set('color_recent', next);
  }

  function clearRecent() {
    setRecent([]);
    ipc.settings.set('color_recent', []);
  }

  function toggleFavorite(color: string) {
    const next = favorites.includes(color)
      ? favorites.filter(c => c !== color)
      : [color, ...favorites].slice(0, 24);
    setFavorites(next);
    ipc.settings.set('color_favorites', next);
  }

  const lbl: React.CSSProperties = {
    fontSize: 10, fontWeight: 600, letterSpacing: '0.07em',
    textTransform: 'uppercase', color: 'var(--text-sec)', marginBottom: 5,
  };

  return (
    <div
      style={{
        width: 252, padding: '12px', borderRadius: 14,
        background: 'var(--bg-panel)', backdropFilter: 'blur(32px) saturate(1.4)',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.55)',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}
      onMouseDown={e => e.stopPropagation()}
    >
      {/* Palette grid */}
      <div>
        <div style={lbl}>{t('editor.color_palette_label')}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {PALETTE.map((row, ri) => (
            <div key={ri} style={{ display: 'flex', gap: 3 }}>
              {row.map(c => (
                <ColorSwatch key={c} color={c} onClick={() => pick(c)}
                  onRightClick={() => toggleFavorite(c)} />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Custom hex + native picker + heart */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div
          title={t('editor.color_palette')}
          onMouseDown={e => { e.preventDefault(); nativeRef.current?.click(); }}
          style={{
            width: 26, height: 26, borderRadius: 6, background: hex, cursor: 'pointer',
            border: '1px solid rgba(255,255,255,0.2)', flexShrink: 0,
          }}
        />
        <input ref={nativeRef} type="color" style={{ display: 'none' }}
          value={hex} onChange={e => pick(e.target.value)} />
        <input
          value={hex}
          onChange={e => { setHex(e.target.value); if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) pick(e.target.value); }}
          onMouseDown={e => e.stopPropagation()}
          style={{
            flex: 1, background: 'var(--glass)', border: '1px solid var(--glass-border)',
            borderRadius: 6, padding: '3px 7px', color: 'var(--text)', fontSize: 12, outline: 'none',
          }}
          placeholder="#000000" maxLength={7}
        />
        <button
          onMouseDown={e => { e.preventDefault(); toggleFavorite(hex); }}
          title={favorites.includes(hex) ? t('editor.color_remove_fav') : t('editor.color_add_fav')}
          style={{
            background: favorites.includes(hex) ? 'var(--accent)' : 'var(--glass)',
            border: 'none', borderRadius: 6, padding: '3px 8px', cursor: 'pointer',
            color: favorites.includes(hex) ? '#fff' : 'var(--text-sec)', fontSize: 14, lineHeight: 1,
          }}
        >♥</button>
      </div>

      {/* Recent */}
      {recent.length > 0 && (
        <div>
          <div style={{ ...lbl, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
            <span>{t('editor.color_recent')}</span>
            <button
              onMouseDown={e => { e.preventDefault(); clearRecent(); }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-sec)', fontSize: 10, padding: 0, opacity: 0.7,
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}
            >{t('editor.color_clear_recent')}</button>
          </div>
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {recent.map(c => (
              <div key={c} style={{ position: 'relative', display: 'inline-flex' }}
                onMouseEnter={e => { const x = e.currentTarget.querySelector('.del-btn') as HTMLElement; if (x) x.style.opacity = '1'; }}
                onMouseLeave={e => { const x = e.currentTarget.querySelector('.del-btn') as HTMLElement; if (x) x.style.opacity = '0'; }}
              >
                <ColorSwatch color={c} size={18} onClick={() => pick(c)} onRightClick={() => removeRecent(c)} />
                <button
                  className="del-btn"
                  onMouseDown={e => { e.preventDefault(); e.stopPropagation(); removeRecent(c); }}
                  style={{
                    position: 'absolute', top: -4, right: -4,
                    width: 10, height: 10, borderRadius: '50%',
                    background: 'var(--danger)', border: 'none', cursor: 'pointer',
                    fontSize: 7, color: '#fff', lineHeight: 1, padding: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: 0, transition: 'opacity 0.1s', pointerEvents: 'all',
                  }}
                >×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Favorites */}
      {favorites.length > 0 && (
        <div>
          <div style={lbl}>
            {t('editor.color_favorites')}
            <span style={{ opacity: 0.5, fontWeight: 400, textTransform: 'none', marginLeft: 4 }}>
              {t('editor.color_rmb_hint')}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {favorites.map(c => <ColorSwatch key={c} color={c} size={18} onClick={() => pick(c)} onRightClick={() => toggleFavorite(c)} />)}
          </div>
        </div>
      )}

      {/* Unset */}
      {currentColor && (
        <button
          onMouseDown={e => { e.preventDefault(); onSelect(null); }}
          style={{
            background: 'transparent', border: '1px solid var(--separator)', borderRadius: 6,
            padding: '4px 8px', cursor: 'pointer', color: 'var(--text-sec)', fontSize: 11,
          }}
        >{t('editor.color_reset')}</button>
      )}
    </div>
  );
}

function ColorPickerButton({ currentColor, onSelect }: {
  currentColor?: string;
  onSelect: (color: string | null) => void;
}) {
  const [open, setOpen]     = useState(false);
  const [pos, setPos]       = useState({ top: 0, left: 0 });
  const btnRef              = useRef<HTMLButtonElement>(null);
  const popupRef            = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!btnRef.current?.contains(e.target as Node) &&
          !popupRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: Math.max(4, r.left - 60) });
    }
    setOpen(p => !p);
  }

  return (
    <>
      <button ref={btnRef} onMouseDown={toggle} title="Цвет текста"
        style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
          padding: '3px 6px', borderRadius: 5, opacity: 0.85,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>A</span>
        <div style={{ width: 14, height: 3, borderRadius: 2, background: currentColor ?? 'var(--accent)' }} />
      </button>
      {open && (
        <div ref={popupRef} style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}>
          <ColorPickerPopup
            currentColor={currentColor}
            onSelect={color => { onSelect(color); if (color !== null) setOpen(false); else setOpen(false); }}
          />
        </div>
      )}
    </>
  );
}

// ── Date picker ───────────────────────────────────────────────────────────────

function DatePickerPopup({ value, onChange, onClose, lang }: {
  value: string | null;
  onChange: (iso: string | null) => void;
  onClose: () => void;
  lang: string;
}) {
  const selected   = value ? new Date(value) : null;
  const [month, setMonth]   = useState(selected ?? new Date());
  const [hours, setHours]   = useState(selected ? String(selected.getHours()).padStart(2, '0') : '12');
  const [mins,  setMins]    = useState(selected ? String(selected.getMinutes()).padStart(2, '0') : '00');

  const locale = lang === 'ru' ? ruLocale : undefined;

  const days    = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const firstDow = (days[0].getDay() + 6) % 7;
  const padded: (Date | null)[] = [...Array(firstDow).fill(null), ...days];
  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) weeks.push(padded.slice(i, i + 7));

  const DOW = lang === 'ru'
    ? ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']
    : ['Mo','Tu','We','Th','Fr','Sa','Su'];

  function pickDay(day: Date) {
    const h = Math.min(23, Math.max(0, parseInt(hours) || 0));
    const m = Math.min(59, Math.max(0, parseInt(mins)  || 0));
    const d = new Date(day);
    d.setHours(h, m, 0, 0);
    onChange(d.toISOString());
    onClose();
  }

  function onTimeConfirm() {
    const base = selected ?? new Date();
    const h = Math.min(23, Math.max(0, parseInt(hours) || 0));
    const m = Math.min(59, Math.max(0, parseInt(mins)  || 0));
    const d = new Date(base);
    d.setHours(h, m, 0, 0);
    onChange(d.toISOString());
    onClose();
  }

  const cellBase: React.CSSProperties = {
    width: 30, height: 30, borderRadius: 8,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 500, cursor: 'pointer', border: 'none',
    transition: 'background 0.1s',
  };

  return (
    <div
      onMouseDown={e => e.stopPropagation()}
      style={{
        width: 252, borderRadius: 14, padding: '12px 12px 10px',
        background: 'var(--bg-panel)', backdropFilter: 'blur(32px) saturate(1.4)',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.55)',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}
    >
      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onMouseDown={e => { e.preventDefault(); setMonth(m => subMonths(m, 1)); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', fontSize: 16, lineHeight: 1, padding: '2px 6px', borderRadius: 6 }}
        >‹</button>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
          {format(month, 'LLLL yyyy', { locale })}
        </span>
        <button
          onMouseDown={e => { e.preventDefault(); setMonth(m => addMonths(m, 1)); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', fontSize: 16, lineHeight: 1, padding: '2px 6px', borderRadius: 6 }}
        >›</button>
      </div>

      {/* DOW row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {DOW.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: 'var(--text-sec)', padding: '2px 0', letterSpacing: '0.04em' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {week.map((day, di) => {
              if (!day) return <div key={di} />;
              const isSel   = selected ? isSameDay(day, selected) : false;
              const todayDay = isToday(day);
              const isWknd  = day.getDay() === 0 || day.getDay() === 6;
              return (
                <button
                  key={di}
                  onMouseDown={e => { e.preventDefault(); pickDay(day); }}
                  style={{
                    ...cellBase,
                    background: isSel
                      ? 'var(--accent)'
                      : todayDay
                        ? 'rgba(10,132,255,0.18)'
                        : 'transparent',
                    color: isSel
                      ? '#fff'
                      : todayDay
                        ? 'var(--accent)'
                        : isWknd
                          ? 'rgba(10,132,255,0.75)'
                          : 'var(--text)',
                    fontWeight: isSel || todayDay ? 700 : 500,
                  }}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Time row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 4, borderTop: '1px solid var(--separator)' }}>
        <span style={{ fontSize: 12, color: 'var(--text-sec)' }}>🕐</span>
        <input
          type="text" inputMode="numeric" maxLength={2}
          value={hours}
          onFocus={e => e.target.select()}
          onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 2); setHours(v); }}
          onBlur={e => { const n = Math.min(23, Math.max(0, parseInt(e.target.value) || 0)); setHours(String(n).padStart(2, '0')); }}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onTimeConfirm(); } }}
          onMouseDown={e => e.stopPropagation()}
          style={{
            width: 36, textAlign: 'center', background: 'var(--glass)',
            border: '1px solid var(--glass-border)', borderRadius: 6,
            color: 'var(--text)', fontSize: 13, padding: '3px 4px', outline: 'none',
          }}
        />
        <span style={{ color: 'var(--text-sec)', fontWeight: 700 }}>:</span>
        <input
          type="text" inputMode="numeric" maxLength={2}
          value={mins}
          onFocus={e => e.target.select()}
          onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 2); setMins(v); }}
          onBlur={e => { const n = Math.min(59, Math.max(0, parseInt(e.target.value) || 0)); setMins(String(n).padStart(2, '0')); }}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onTimeConfirm(); } }}
          onMouseDown={e => e.stopPropagation()}
          style={{
            width: 36, textAlign: 'center', background: 'var(--glass)',
            border: '1px solid var(--glass-border)', borderRadius: 6,
            color: 'var(--text)', fontSize: 13, padding: '3px 4px', outline: 'none',
          }}
        />
        <button
          onMouseDown={e => { e.preventDefault(); onTimeConfirm(); }}
          style={{
            marginLeft: 'auto', height: 26, padding: '0 10px', borderRadius: 6,
            background: 'var(--accent)', border: 'none', cursor: 'pointer',
            color: '#fff', fontSize: 12, fontWeight: 600,
          }}
        >OK</button>
      </div>

      {/* Clear */}
      {value && (
        <button
          onMouseDown={e => { e.preventDefault(); onChange(null); onClose(); }}
          style={{
            background: 'none', border: '1px solid var(--separator)', borderRadius: 6,
            padding: '4px 8px', cursor: 'pointer', color: 'var(--text-sec)', fontSize: 11,
          }}
        >
          {lang === 'ru' ? 'Сбросить' : 'Clear'}
        </button>
      )}
    </div>
  );
}

function DatePickerButton({ value, onChange, placeholder, lang }: {
  value: string | null;
  onChange: (iso: string | null) => void;
  placeholder: string;
  lang: string;
}) {
  const [open, setOpen] = useState(false);
  const [pos,  setPos]  = useState({ top: 0, left: 0 });
  const btnRef   = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!btnRef.current?.contains(e.target as Node) &&
          !popupRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      const left = Math.min(r.left, window.innerWidth - 270);
      const top  = r.bottom + 6;
      setPos({ top, left: Math.max(4, left) });
    }
    setOpen(p => !p);
  }

  const label = value
    ? format(new Date(value), lang === 'ru' ? 'd MMM, HH:mm' : 'MMM d, HH:mm', {
        locale: lang === 'ru' ? ruLocale : undefined,
      })
    : placeholder;

  return (
    <>
      <button
        ref={btnRef}
        onMouseDown={toggle}
        style={{
          height: 28, padding: '0 8px', borderRadius: 8, fontSize: 12,
          background: value ? 'rgba(10,132,255,0.12)' : 'var(--glass)',
          border: `1px solid ${value ? 'var(--accent)' : 'var(--glass-border)'}`,
          color: value ? 'var(--accent)' : 'var(--text-sec)',
          cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: value ? 600 : 400,
        }}
      >
        {label}
      </button>
      {value && (
        <button
          onClick={() => onChange(null)}
          style={{ height: 28, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-done)', fontSize: 16, lineHeight: '28px', padding: '0 2px' }}
        >×</button>
      )}
      {open && (
        <div ref={popupRef} style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}>
          <DatePickerPopup
            value={value}
            onChange={v => { onChange(v); }}
            onClose={() => setOpen(false)}
            lang={lang}
          />
        </div>
      )}
    </>
  );
}

interface CustomFont { name: string; data: string; }

function FormatToolbar({ editor, customFonts, onAddFont }: {
  editor: ReturnType<typeof useEditor> | null;
  customFonts: CustomFont[];
  onAddFont: () => void;
}) {
  if (!editor) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e = editor as any;
  const color = e.getAttributes('textStyle').color as string | undefined;
  const font  = e.getAttributes('textStyle').fontFamily as string | undefined;
  const size  = (e.getAttributes('textStyle').fontSize as string | undefined)?.replace('px', '') ?? '';

  const comboStyle: React.CSSProperties = {
    background: 'var(--bg-combo, var(--glass))', color: 'var(--text)',
    border: '1px solid var(--glass-border)', borderRadius: 5,
    fontSize: 12, padding: '2px 4px', outline: 'none', cursor: 'pointer',
  };

  const chain = () => e.chain().focus();

  function onFontChange(ev: React.ChangeEvent<HTMLSelectElement>) {
    const v = ev.target.value;
    if (v === '__add__') {
      onAddFont();
      return;
    }
    chain().setMark('textStyle', { fontFamily: v || null }).run();
  }

  return (
    <div
      onMouseDown={ev => ev.preventDefault()}
      style={{
        display: 'flex', alignItems: 'center', gap: 2, flexDirection: 'row',
        padding: '4px 6px', flexShrink: 0, flexWrap: 'wrap', rowGap: 2,
        background: 'var(--glass)', borderRadius: 8,
        border: '1px solid var(--glass-border)',
      }}
    >
      <ToolBtn active={e.isActive('bold')}   onClick={() => chain().toggleBold().run()}   title="Жирный (Ctrl+B)"><b>B</b></ToolBtn>
      <ToolBtn active={e.isActive('italic')} onClick={() => chain().toggleItalic().run()} title="Курсив (Ctrl+I)"><i>I</i></ToolBtn>
      <ToolBtn active={e.isActive('strike')} onClick={() => chain().toggleStrike().run()} title="Зачёркнутый"><s>S</s></ToolBtn>

      <FmtDivider />

      <select
        style={{ ...comboStyle, width: 86 }}
        value={font ?? ''}
        onMouseDown={ev => ev.stopPropagation()}
        onChange={onFontChange}
      >
        {FONTS.map(f => <option key={f.label} value={f.value}>{f.label}</option>)}
        {customFonts.map(f => (
          <option key={f.name} value={`"${f.name}", sans-serif`}>{f.name}</option>
        ))}
        <option value="__add__">+ Добавить шрифт…</option>
      </select>

      <select
        style={{ ...comboStyle, width: 56 }}
        value={size}
        onMouseDown={ev => ev.stopPropagation()}
        onChange={ev => chain().setMark('textStyle', { fontSize: ev.target.value ? `${ev.target.value}px` : null }).run()}
      >
        <option value="">—</option>
        {SIZES.map(s => <option key={s} value={s}>{s}px</option>)}
      </select>

      <FmtDivider />

      <ColorPickerButton
        currentColor={color}
        onSelect={c => c ? chain().setColor(c).run() : chain().unsetColor().run()}
      />

      <FmtDivider />

      <ToolBtn onClick={() => chain().clearNodes().unsetAllMarks().run()} title="Сбросить форматирование">
        T<sub style={{ fontSize: 8 }}>×</sub>
      </ToolBtn>
    </div>
  );
}

const PRIORITY_LABELS = ['—', '🔵', '🟠', '🔴'];

interface Props {
  taskId: number;
}

export function TaskEditor({ taskId }: Props) {
  const { t, i18n } = useTranslation();
  const tasks        = useTaskStore(s => s.tasks);
  const updateTask   = useTaskStore(s => s.updateTask);
  const updateFields = useTaskStore(s => s.updateFields);
  const deleteTask   = useTaskStore(s => s.deleteTask);
  const selectTask   = useTaskStore(s => s.selectTask);
  const categories   = useCategoryStore(s => s.categories);

  const task = tasks.find(t => t.id === taskId);

  const [title, setTitle]         = useState('');
  const [subtasks, setSubtasks]   = useState<Subtask[]>([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [customFonts, setCustomFonts] = useState<CustomFont[]>([]);

  const titleRef  = useRef('');
  titleRef.current = title;

  const titleTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const descTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fontFileRef = useRef<HTMLInputElement>(null);

  // ── Custom fonts ───────────────────────────────────────────────────────────
  async function registerFont(f: CustomFont) {
    if (document.fonts.check(`12px "${f.name}"`)) return;
    try {
      const face = new FontFace(f.name, `url(${f.data})`);
      await face.load();
      document.fonts.add(face);
    } catch { /* skip bad font */ }
  }

  useEffect(() => {
    ipc.settings.get('custom_fonts', []).then((saved: unknown) => {
      if (!Array.isArray(saved) || saved.length === 0) return;
      const fonts = saved as CustomFont[];
      setCustomFonts(fonts);
      fonts.forEach(registerFont);
    });
  }, []);

  async function handleFontFilePick(files: FileList | null) {
    if (!files?.length) return;
    const file = files[0];
    const name = file.name.replace(/\.(ttf|otf|woff2?)$/i, '');
    const data = await new Promise<string>(resolve => {
      const r = new FileReader();
      r.onload = e => resolve(e.target!.result as string);
      r.readAsDataURL(file);
    });
    const newFont: CustomFont = { name, data };
    await registerFont(newFont);
    const next = [...customFonts.filter(f => f.name !== name), newFont];
    setCustomFonts(next);
    ipc.settings.set('custom_fonts', next);
    // Reset input so the same file can be picked again
    if (fontFileRef.current) fontFileRef.current.value = '';
  }

  // ── Tiptap ────────────────────────────────────────────────────────────────
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: t('tasks.description_placeholder') }),
      TextStyle,
      Color,
      FontSizeExtension,
      FontFamilyExtension,
    ],
    content: '',
    onUpdate: ({ editor }) => {
      if (descTimer.current) clearTimeout(descTimer.current);
      descTimer.current = setTimeout(() => {
        updateTask(taskId, titleRef.current, editor.getHTML());
      }, 500);
    },
  });

  useEffect(() => {
    if (task) setTitle(task.title);
    editor?.commands.setContent(task?.description || '');
    ipc.subtasks.list(taskId).then(subs => setSubtasks(subs as Subtask[]));
  }, [taskId]);

  useEffect(() => {
    if (editor && task) editor.commands.setContent(task.description || '');
  }, [editor]);

  function onTitleChange(val: string) {
    setTitle(val);
    if (titleTimer.current) clearTimeout(titleTimer.current);
    titleTimer.current = setTimeout(() => {
      updateTask(taskId, val, editor?.getHTML() || '');
    }, 400);
  }

  // ── Subtasks ───────────────────────────────────────────────────────────────
  async function addSubtask() {
    if (!newSubtask.trim()) return;
    const id = await ipc.subtasks.add(taskId, newSubtask.trim());
    setSubtasks(prev => [...prev, { id: id as number, task_id: taskId, title: newSubtask.trim(), is_done: false, sort_order: prev.length }]);
    setNewSubtask('');
  }

  async function toggleSubtask(id: number, done: boolean) {
    await ipc.subtasks.setDone(id, done);
    setSubtasks(prev => prev.map(s => s.id === id ? { ...s, is_done: done } : s));
  }

  async function removeSubtask(id: number) {
    await ipc.subtasks.delete(id);
    setSubtasks(prev => prev.filter(s => s.id !== id));
  }

  if (!task) {
    return (
      <div className="flex items-center justify-center h-full">
        <p style={{ color: 'var(--text-sec)', fontSize: 14 }}>{t('tasks.select_hint')}</p>
      </div>
    );
  }

  async function handleDelete() {
    if (!confirm(t('tasks.delete_confirm'))) return;
    await deleteTask(taskId);
    selectTask(null);
  }

  return (
    <div className="flex flex-col h-full overflow-hidden px-5 py-4 gap-3">

      {/* ── Title ── */}
      <input
        value={title}
        onChange={e => onTitleChange(e.target.value)}
        placeholder={t('tasks.title_placeholder')}
        className="w-full outline-none bg-transparent flex-shrink-0"
        style={{ color: 'var(--text)', border: 'none', padding: 0, fontSize: 22, fontWeight: 700, lineHeight: 1.3 }}
      />

      {/* ── Row 1: task context — 3 visual groups ── */}
      <div
        className="flex items-center flex-wrap flex-shrink-0 py-2"
        style={{ borderBottom: '1px solid var(--separator)', gap: '6px 10px' }}
      >

        {/* ── Group 1: Status + Priority ── */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => useTaskStore.getState().setDone(taskId, !task.is_done)}
            className="flex items-center gap-1.5 px-2.5 transition-all"
            style={{
              height: 28, borderRadius: 8, fontSize: 12, fontWeight: 500,
              border: `1px solid ${task.is_done ? 'var(--success)' : 'var(--glass-border)'}`,
              background: task.is_done ? 'rgba(48,209,88,0.15)' : 'var(--glass)',
              color: task.is_done ? 'var(--success)' : 'var(--text-sec)',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 10 }}>{task.is_done ? '✓' : '○'}</span>
            {task.is_done ? t('tasks.filter_done') : t('editor.mark_done')}
          </button>
          {[0, 1, 2, 3].map(p => (
            <button
              key={p}
              onClick={() => { ipc.tasks.setPriority(taskId, p); updateFields(taskId, { priority: p as any }); }}
              style={{
                height: 28, width: 28, borderRadius: 8, fontSize: 13,
                border: task.priority === p ? '1px solid var(--glass-border-top)' : '1px solid transparent',
                cursor: 'pointer',
                background: task.priority === p ? 'var(--accent)' : 'var(--glass)',
                color: task.priority === p ? '#fff' : 'var(--text-sec)',
                transition: 'all 0.12s',
              }}
            >
              {PRIORITY_LABELS[p]}
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 20, background: 'var(--separator)', flexShrink: 0 }} />

        {/* ── Group 2: Category + Deadline + Recurrence ── */}
        <div className="flex items-center gap-1">
          <select
            value={task.category_id ?? ''}
            onChange={e => {
              const val = e.target.value === '' ? null : Number(e.target.value);
              ipc.tasks.setCategory(taskId, val); updateFields(taskId, { category_id: val });
            }}
            style={{ height: 28, background: 'var(--bg-combo)', color: 'var(--text)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0 8px', fontSize: 12, outline: 'none', cursor: 'pointer' }}
          >
            <option value="">{t('tasks.no_category')}</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <div className="flex items-center gap-0.5">
            <DatePickerButton
              value={task.deadline_at ?? null}
              onChange={iso => { ipc.tasks.setDeadline(taskId, iso); updateFields(taskId, { deadline_at: iso }); }}
              placeholder={t('tasks.deadline')}
              lang={i18n.language}
            />
          </div>

          <select
            value={task.recurrence ?? ''}
            onChange={e => {
              const val = e.target.value || null;
              ipc.tasks.setRecurrence(taskId, val); updateFields(taskId, { recurrence: val as any });
            }}
            style={{ height: 28, background: 'var(--bg-combo)', color: 'var(--text)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0 8px', fontSize: 12, outline: 'none', cursor: 'pointer' }}
          >
            <option value="">{t('tasks.recurrence_none')}</option>
            <option value="daily">{t('tasks.recurrence_daily')}</option>
            <option value="weekly">{t('tasks.recurrence_weekly')}</option>
            <option value="monthly">{t('tasks.recurrence_monthly')}</option>
          </select>
        </div>

        <div style={{ width: 1, height: 20, background: 'var(--separator)', flexShrink: 0 }} />

        {/* ── Group 3: Tags + Reminder + Pin ── */}
        <div className="flex items-center gap-1">
          <input
            value={task.tags}
            onChange={e => { ipc.tasks.setTags(taskId, e.target.value); updateFields(taskId, { tags: e.target.value }); }}
            placeholder={t('tasks.tags')}
            style={{ height: 28, background: 'var(--bg-combo)', color: 'var(--text)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0 8px', fontSize: 12, outline: 'none', width: 110 }}
          />

          <div className="flex items-center gap-0.5">
            <span style={{ fontSize: 12, color: 'var(--text-sec)', lineHeight: '28px', userSelect: 'none' }}>🔔</span>
            <DatePickerButton
              value={task.remind_at ?? null}
              onChange={iso => { ipc.tasks.setReminder(taskId, iso); updateFields(taskId, { remind_at: iso, remind_shown: false }); }}
              placeholder={t('tasks.reminder')}
              lang={i18n.language}
            />
          </div>

          <button
            onClick={() => { ipc.tasks.setPinned(taskId, !task.is_pinned); updateFields(taskId, { is_pinned: !task.is_pinned }); }}
            title="Закрепить"
            style={{
              height: 28, width: 28, borderRadius: 8, fontSize: 13,
              border: task.is_pinned ? '1px solid var(--accent)' : '1px solid var(--glass-border)',
              cursor: 'pointer',
              background: task.is_pinned ? 'var(--accent)' : 'var(--glass)',
              color: task.is_pinned ? '#fff' : 'var(--text-done)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.12s',
            }}
          >
            📌
          </button>
        </div>
      </div>

      {/* ── Row 2: editor toolbar ── */}
      <FormatToolbar editor={editor} customFonts={customFonts} onAddFont={() => fontFileRef.current?.click()} />
      <input
        ref={fontFileRef}
        type="file"
        accept=".ttf,.otf,.woff,.woff2"
        style={{ display: 'none' }}
        onChange={e => handleFontFilePick(e.target.files)}
      />

      {/* ── Body: description (left) + subtasks (right) ── */}
      <div className="flex flex-1 min-h-0 gap-4">

        {/* Description — fills all available height */}
        <div
          className="flex-1 min-w-0 rounded-xl tiptap-editor tiptap-full-height glass-content"
          style={{ overflow: 'hidden' }}
        >
          <EditorContent editor={editor} style={{ height: '100%', overflow: 'auto' }} />
        </div>

        {/* Subtasks column */}
        <div
          className="flex flex-col gap-0 flex-shrink-0 rounded-xl glass-content"
          style={{ width: 300, overflow: 'hidden' }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-3 py-2.5 flex-shrink-0"
            style={{ borderBottom: '1px solid var(--glass-border)' }}
          >
            <span style={{ color: 'var(--text-sec)', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {t('tasks.subtasks')}
            </span>
            {subtasks.length > 0 && (
              <span style={{ fontSize: 11, color: 'var(--text-done)' }}>
                {subtasks.filter(s => s.is_done).length}/{subtasks.length}
              </span>
            )}
          </div>

          {/* Subtask list — scrollable */}
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-0 px-2 py-2">
            {subtasks.length === 0 && (
              <p style={{ color: 'var(--text-done)', fontSize: 12, textAlign: 'center', marginTop: 12 }}>
                {t('tasks.no_subtasks')}
              </p>
            )}
            {subtasks.map(sub => (
              <div
                key={sub.id}
                className="flex items-center gap-2 group px-1 py-1.5 rounded-lg"
                style={{ transition: 'background 0.1s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--glass-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <button
                  onClick={() => toggleSubtask(sub.id, !sub.is_done)}
                  className="rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    width: 16, height: 16,
                    border: `2px solid ${sub.is_done ? 'var(--accent)' : 'var(--glass-border)'}`,
                    background: sub.is_done ? 'var(--accent)' : 'transparent',
                    cursor: 'pointer', fontSize: 9, color: '#fff',
                  }}
                >
                  {sub.is_done && '✓'}
                </button>
                <span
                  className="flex-1 text-sm truncate"
                  style={{ color: sub.is_done ? 'var(--text-done)' : 'var(--text)', textDecoration: sub.is_done ? 'line-through' : 'none' }}
                >
                  {sub.title}
                </span>
                <button
                  onClick={() => removeSubtask(sub.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-done)', fontSize: 16, lineHeight: 1, padding: '0 2px', opacity: 0 }}
                  className="group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* Add subtask input */}
          <div
            className="flex gap-2 flex-shrink-0 px-2 py-2"
            style={{ borderTop: '1px solid var(--glass-border)' }}
          >
            <input
              value={newSubtask}
              onChange={e => setNewSubtask(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSubtask(); } }}
              placeholder={t('tasks.add_subtask')}
              className="flex-1 rounded-lg px-2 py-1.5 text-sm outline-none"
              style={{ background: 'var(--glass)', color: 'var(--text)', border: '1px solid var(--glass-border)', minWidth: 0 }}
            />
            <button
              onClick={addSubtask}
              style={{ background: 'var(--accent)', border: 'none', cursor: 'pointer', color: '#fff', borderRadius: 8, padding: '4px 10px', fontSize: 15, fontWeight: 700, flexShrink: 0 }}
            >
              +
            </button>
          </div>

          {/* Delete */}
          <div className="px-2 pb-2 flex-shrink-0">
            <button
              onClick={handleDelete}
              className="w-full px-3 py-1.5 rounded-lg text-sm"
              style={{ background: 'none', border: '1px solid var(--danger)', color: 'var(--danger)', cursor: 'pointer' }}
            >
              {t('common.delete')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
