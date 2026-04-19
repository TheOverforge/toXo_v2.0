import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ipc } from '@/shared/api/ipc';

declare module 'react' {
  interface CSSProperties {
    WebkitAppRegion?: 'drag' | 'no-drag';
  }
}

/* ── Icons (8×8, dark stroke — visible on colored circles) ─────────────────── */
const S = 'rgba(0,0,0,0.72)';

function IcoClose() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
      <line x1="1.5" y1="1.5" x2="6.5" y2="6.5" stroke={S} strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="6.5" y1="1.5" x2="1.5" y2="6.5" stroke={S} strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

function IcoMin() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
      <line x1="1.5" y1="4" x2="6.5" y2="4" stroke={S} strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

function IcoMax() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
      {/* expand arrows from corners */}
      <polyline points="1,3 1,1 3,1" stroke={S} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <polyline points="5,1 7,1 7,3" stroke={S} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <polyline points="7,5 7,7 5,7" stroke={S} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <polyline points="3,7 1,7 1,5" stroke={S} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

function IcoRestore() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
      <rect x="2.5" y="0.5" width="5" height="5" rx="1" stroke={S} strokeWidth="1.3"/>
      <path d="M0.5 2.5 H1.5 V7.5 H6.5 V6.5" stroke={S} strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

/* ── Traffic-light dot ──────────────────────────────────────────────────────── */
interface DotProps {
  id: 'min' | 'max' | 'close';
  color: string;
  hoverColor: string;
  glow: string;
  showIcon: boolean;
  isHovered: boolean;
  icon: React.ReactNode;
  onHover: (id: 'min' | 'max' | 'close' | null) => void;
  onClick: () => void;
  title: string;
}

function Dot({ id, color, hoverColor, glow, showIcon, isHovered, icon, onHover, onClick, title }: DotProps) {
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => onHover(id)}
      onMouseLeave={() => onHover(null)}
      style={{
        width: 15,
        height: 15,
        borderRadius: '50%',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        background: isHovered ? hoverColor : color,
        boxShadow: isHovered ? `0 0 8px 2px ${glow}` : `0 1px 3px rgba(0,0,0,0.35)`,
        transform: isHovered ? 'scale(1.12)' : 'scale(1)',
        transition: 'all 0.13s ease',
        WebkitAppRegion: 'no-drag' as any,
      }}
    >
      {showIcon && icon}
    </button>
  );
}

/* ── Main component ─────────────────────────────────────────────────────────── */
export function WindowControls() {
  const { t } = useTranslation();
  const [isMaximized, setIsMaximized] = useState(false);
  const [groupHovered, setGroupHovered] = useState(false);
  const [hovered, setHovered] = useState<'min' | 'max' | 'close' | null>(null);

  useEffect(() => {
    ipc.window?.isMaximized().then(setIsMaximized);
    const unsub = ipc.on('window:maximized', (val: unknown) => setIsMaximized(val as boolean));
    return unsub;
  }, []);

  const handleHover = (id: 'min' | 'max' | 'close' | null) => setHovered(id);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginLeft: 'auto',
        paddingRight: 16,
        height: '100%',
        WebkitAppRegion: 'no-drag' as any,
      }}
      onMouseEnter={() => setGroupHovered(true)}
      onMouseLeave={() => { setGroupHovered(false); setHovered(null); }}
    >
      <Dot
        id="min"
        color="rgba(255,189,40,0.78)"
        hoverColor="#ffbd28"
        glow="rgba(255,189,40,0.55)"
        showIcon={groupHovered}
        isHovered={hovered === 'min'}
        icon={<IcoMin />}
        onHover={handleHover}
        onClick={() => ipc.window?.minimize()}
        title={t('window_controls.minimize')}
      />
      <Dot
        id="max"
        color="rgba(40,202,65,0.78)"
        hoverColor="#28ca41"
        glow="rgba(40,202,65,0.50)"
        showIcon={groupHovered}
        isHovered={hovered === 'max'}
        icon={isMaximized ? <IcoRestore /> : <IcoMax />}
        onHover={handleHover}
        onClick={() => ipc.window?.maximize()}
        title={isMaximized ? t('window_controls.restore') : t('window_controls.maximize')}
      />
      <Dot
        id="close"
        color="rgba(255,69,58,0.85)"
        hoverColor="#ff4538"
        glow="rgba(255,69,58,0.60)"
        showIcon={groupHovered}
        isHovered={hovered === 'close'}
        icon={<IcoClose />}
        onHover={handleHover}
        onClick={() => ipc.window?.close()}
        title={t('common.close')}
      />
    </div>
  );
}
