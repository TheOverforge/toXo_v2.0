import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Page } from '@/app/App';

interface Step {
  page?: Page;
  selector?: string;
  titleKey: string;
  bodyKey: string;
  placement?: 'right' | 'left' | 'top' | 'bottom' | 'center';
}

const STEPS: Step[] = [
  {
    titleKey: 'tour.s0_title', bodyKey: 'tour.s0_body',
    placement: 'center',
  },
  {
    page: 'tasks', selector: '[data-tour="sidebar"]',
    titleKey: 'tour.s1_title', bodyKey: 'tour.s1_body',
    placement: 'right',
  },
  {
    page: 'tasks', selector: '[data-tour="new-task"]',
    titleKey: 'tour.s2_title', bodyKey: 'tour.s2_body',
    placement: 'bottom',
  },
  {
    page: 'tasks', selector: '[data-tour="filter-bar"]',
    titleKey: 'tour.s3_title', bodyKey: 'tour.s3_body',
    placement: 'bottom',
  },
  {
    page: 'tasks', selector: '[data-tour="task-list"]',
    titleKey: 'tour.s4_title', bodyKey: 'tour.s4_body',
    placement: 'right',
  },
  {
    page: 'tasks', selector: '[data-tour="task-editor"]',
    titleKey: 'tour.s5_title', bodyKey: 'tour.s5_body',
    placement: 'left',
  },
  {
    page: 'calendar', selector: '[data-tour="calendar-grid"]',
    titleKey: 'tour.s6_title', bodyKey: 'tour.s6_body',
    placement: 'left',
  },
  {
    page: 'analytics', selector: '[data-tour="analytics-header"]',
    titleKey: 'tour.s7_title', bodyKey: 'tour.s7_body',
    placement: 'bottom',
  },
  {
    page: 'finance', selector: '[data-tour="finance-quickadd"]',
    titleKey: 'tour.s8_title', bodyKey: 'tour.s8_body',
    placement: 'right',
  },
  {
    page: 'settings', selector: '[data-tour="settings-data"]',
    titleKey: 'tour.s9_title', bodyKey: 'tour.s9_body',
    placement: 'right',
  },
  {
    titleKey: 'tour.s10_title', bodyKey: 'tour.s10_body',
    placement: 'center',
  },
];

interface Rect { top: number; left: number; width: number; height: number; }

interface Props {
  currentPage: Page;
  onNavigate: (p: Page) => void;
  onDone: (suppress: boolean) => void;
  onStepReady?: (stepIdx: number) => void;
}

const PAD = 10;
const TIP_W = 300;
const TIP_H = 230;
const GAP = 16;

export function TourOverlay({ currentPage, onNavigate, onDone, onStepReady }: Props) {
  const { t } = useTranslation();
  const [step, setStep]           = useState(0);
  const [rect, setRect]           = useState<Rect | null>(null);
  const [suppress, setSuppress]   = useState(false);
  const [navigating, setNavigating] = useState(false);
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const current = STEPS[step];

  // Compute highlight rect after step/page changes settle
  const computeRect = useCallback(() => {
    if (rectTimerRef.current) clearTimeout(rectTimerRef.current);
    rectTimerRef.current = setTimeout(() => {
      if (!current.selector) { setRect(null); return; }
      const el = document.querySelector(current.selector);
      if (!el) { setRect(null); return; }
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    }, 80);
  }, [current]);

  useEffect(() => {
    computeRect();
    return () => { if (rectTimerRef.current) clearTimeout(rectTimerRef.current); };
  }, [computeRect]);

  // Re-compute on window resize
  useEffect(() => {
    window.addEventListener('resize', computeRect);
    return () => window.removeEventListener('resize', computeRect);
  }, [computeRect]);

  function goToStep(newStep: number) {
    const next = STEPS[newStep];
    const needsNav = next.page && next.page !== currentPage;

    if (needsNav) {
      setNavigating(true);
      setRect(null);
      onNavigate(next.page!);
      if (navTimerRef.current) clearTimeout(navTimerRef.current);
      navTimerRef.current = setTimeout(() => {
        setStep(newStep);
        setNavigating(false);
        onStepReady?.(newStep);
      }, 320);
    } else {
      setStep(newStep);
      onStepReady?.(newStep);
    }
  }

  function next() {
    if (step < STEPS.length - 1) goToStep(step + 1);
    else onDone(suppress);
  }
  function prev() {
    if (step > 0) goToStep(step - 1);
  }

  useEffect(() => {
    return () => {
      if (navTimerRef.current) clearTimeout(navTimerRef.current);
      if (rectTimerRef.current) clearTimeout(rectTimerRef.current);
    };
  }, []);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
      if (e.key === 'Escape') onDone(suppress);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [step, suppress, navigating]);

  const spotRect = rect ? {
    top:    rect.top    - PAD,
    left:   rect.left   - PAD,
    width:  rect.width  + PAD * 2,
    height: rect.height + PAD * 2,
  } : null;

  function tooltipPos(): React.CSSProperties {
    if (!spotRect || current.placement === 'center' || navigating) {
      return { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' };
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let top: number, left: number;

    switch (current.placement) {
      case 'right':
        top  = spotRect.top;
        left = spotRect.left + spotRect.width + GAP;
        break;
      case 'left':
        top  = spotRect.top;
        left = spotRect.left - TIP_W - GAP;
        break;
      case 'bottom':
        top  = spotRect.top + spotRect.height + GAP;
        left = spotRect.left;
        break;
      case 'top':
        top  = spotRect.top - TIP_H - GAP;
        left = spotRect.left;
        break;
      default:
        return { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' };
    }

    // Clamp to viewport
    left = Math.max(12, Math.min(left, vw - TIP_W - 12));
    top  = Math.max(12, Math.min(top,  vh - TIP_H - 12));

    return { top, left };
  }

  const progress = Math.round((step / (STEPS.length - 1)) * 100);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, pointerEvents: 'none' }}>
      {/* Dimmed backdrop */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.72)', transition: 'opacity 0.2s' }} />

      {/* Spotlight cutout */}
      {spotRect && !navigating && (
        <div style={{
          position: 'absolute',
          top: spotRect.top, left: spotRect.left,
          width: spotRect.width, height: spotRect.height,
          borderRadius: 12,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.72)',
          border: '2px solid rgba(10,132,255,0.8)',
          background: 'transparent',
          zIndex: 1001,
          transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
        }} />
      )}

      {/* Tooltip card */}
      <div style={{
        position: 'absolute', ...tooltipPos(),
        width: TIP_W,
        background: 'rgba(12, 12, 28, 0.97)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 18,
        padding: '20px 20px 16px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.8), 0 0 0 1px rgba(10,132,255,0.15)',
        zIndex: 1002,
        pointerEvents: 'all',
        transition: navigating ? 'none' : 'top 0.25s cubic-bezier(0.4,0,0.2,1), left 0.25s cubic-bezier(0.4,0,0.2,1)',
      }}>
        {/* Progress bar */}
        <div style={{ height: 2, borderRadius: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 14, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 1,
            background: 'linear-gradient(90deg, #0a84ff, #5e5ce6)',
            width: `${progress}%`,
            transition: 'width 0.3s ease',
          }} />
        </div>

        {/* Step dots */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 14, flexWrap: 'wrap' }}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              onClick={() => !navigating && goToStep(i)}
              style={{
                width: i === step ? 18 : 5, height: 5, borderRadius: 3,
                background: i === step ? '#0a84ff' : i < step ? 'rgba(10,132,255,0.4)' : 'rgba(255,255,255,0.15)',
                transition: 'width 0.3s, background 0.2s',
                cursor: navigating ? 'default' : 'pointer',
              }}
            />
          ))}
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginLeft: 'auto', lineHeight: '5px', paddingTop: 0 }}>
            {step + 1} / {STEPS.length}
          </span>
        </div>

        {navigating ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0' }}>
            <div style={{
              width: 16, height: 16, borderRadius: '50%',
              border: '2px solid rgba(10,132,255,0.3)',
              borderTopColor: '#0a84ff',
              animation: 'spin 0.7s linear infinite',
              flexShrink: 0,
            }} />
            <span style={{ fontSize: 13, color: '#9090b0' }}>{t('tour.navigating')}</span>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#f0f0f7', marginBottom: 8, lineHeight: 1.4 }}>
              {t(current.titleKey)}
            </p>
            <p style={{ fontSize: 13, color: '#9090b0', lineHeight: 1.65, marginBottom: 14 }}>
              {t(current.bodyKey)}
            </p>
          </>
        )}

        {/* Suppress checkbox */}
        <label style={{
          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12,
          cursor: 'pointer', fontSize: 12, color: '#55556a',
        }}>
          <input
            type="checkbox"
            checked={suppress}
            onChange={e => setSuppress(e.target.checked)}
            style={{ cursor: 'pointer', accentColor: '#0a84ff' }}
          />
          {t('tour.dont_show')}
        </label>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={() => onDone(suppress)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#44445a', fontSize: 12, padding: '4px 0' }}
          >
            {t('tour.skip')}
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            {step > 0 && (
              <button
                onClick={prev}
                disabled={navigating}
                style={{
                  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: 9, cursor: navigating ? 'default' : 'pointer',
                  color: '#aaa', fontSize: 13, padding: '7px 14px',
                  opacity: navigating ? 0.4 : 1,
                }}
              >←</button>
            )}
            <button
              onClick={next}
              disabled={navigating}
              style={{
                background: navigating ? 'rgba(10,132,255,0.4)' : 'linear-gradient(135deg, #0a84ff, #5e5ce6)',
                border: 'none', borderRadius: 9,
                cursor: navigating ? 'default' : 'pointer',
                color: '#fff', fontSize: 13, fontWeight: 600, padding: '7px 18px',
                boxShadow: navigating ? 'none' : '0 4px 14px rgba(10,132,255,0.35)',
                transition: 'opacity 0.15s',
              }}
            >
              {step === STEPS.length - 1 ? t('tour.finish') : t('tour.next')}
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
