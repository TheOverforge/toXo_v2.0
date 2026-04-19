import React, { useEffect, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ThemeProvider } from './providers/ThemeProvider';
import { TasksPage } from '@/pages/tasks/TasksPage';
import { AnalyticsPage } from '@/pages/analytics/AnalyticsPage';
import { CalendarPage } from '@/pages/calendar/CalendarPage';
import { FinancePage } from '@/pages/finance/FinancePage';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { AppSidebar } from '@/widgets/app-sidebar/AppSidebar';
import { TourOverlay } from '@/widgets/tour/TourOverlay';
import { WindowControls } from '@/widgets/window-controls/WindowControls';
import { CommandPalette } from '@/widgets/command-palette/CommandPalette';
import { LaunchOverlay } from '@/widgets/launch-overlay/LaunchOverlay';
import { useTaskStore } from '@/entities/task/store';
import { useCategoryStore } from '@/entities/category/store';
import { ipc } from '@/shared/api/ipc';
import { playNotificationSound } from '@/shared/sounds';

export type Page = 'tasks' | 'analytics' | 'calendar' | 'finance' | 'settings';

export default function App() {
  const [page, setPage]               = useState<Page>('tasks');
  const [showTour, setShowTour]       = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [appReady, setAppReady]       = useState(false);
  const fetchTasks      = useTaskStore(s => s.fetchAll);
  const fetchCategories = useCategoryStore(s => s.fetchAll);

  useEffect(() => {
    let cancelled = false;
    const initStart = Date.now();

    async function init() {
      await Promise.all([fetchTasks(), fetchCategories()]);

      // ── Tour check ─────────────────────────────────────────────────────────
      const suppressed = await ipc.settings.get('tour_suppressed', false) as boolean;
      if (!suppressed && !cancelled) {
        setTimeout(() => setShowTour(true), 600);
      }

      // Toggle .maximized on <html> so CSS can use an opaque fallback background
      ipc.window?.isMaximized().then(v =>
        document.documentElement.classList.toggle('maximized', v)
      );

      // ── Enforce minimum splash display time ────────────────────────────────
      const elapsed = Date.now() - initStart;
      const minMs   = 4000;
      if (elapsed < minMs) await new Promise(r => setTimeout(r, minMs - elapsed));

      // ── Feature 3: first-run — auto-open welcome task once ─────────────────
      // ensureWelcomeTask creates the task if it doesn't exist yet.
      const welcomeShown = await ipc.settings.get('welcome_shown', false) as boolean;
      let pendingWelcomeId: number | null = null;
      if (!welcomeShown && !cancelled) {
        pendingWelcomeId = await ipc.tasks.ensureWelcomeTask() as number;
        await useTaskStore.getState().fetchAll();
        await ipc.settings.set('welcome_shown', true);
      }

      if (!cancelled) setAppReady(true);

      // Select AFTER overlay starts fading (overlay fade = 60 + 420ms)
      if (pendingWelcomeId !== null && !cancelled) {
        setTimeout(() => useTaskStore.getState().selectTask(pendingWelcomeId!), 550);
      }
    }

    init();

    const offMax = ipc.on('window:maximized', (v: unknown) => {
      document.documentElement.classList.toggle('maximized', v as boolean);
    });

    return () => {
      cancelled = true;
      offMax();
    };
  }, []);

  // Play notification sound when main process fires reminders / deadline alerts
  useEffect(() => {
    async function playConfiguredSound() {
      const enabled = await ipc.settings.get('notifications_enabled', true) as boolean;
      if (!enabled) return;
      const key = await ipc.settings.get('notification_sound', 'toXo_default') as string;
      playNotificationSound(key || 'toXo_default');
    }
    const offReminder = ipc.on('notification:reminderFired',  () => { playConfiguredSound(); });
    const offDeadline = ipc.on('notification:deadlineFired',  () => { playConfiguredSound(); });
    return () => { offReminder(); offDeadline(); };
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && e.code === 'KeyK') {
        e.preventDefault();
        setShowPalette(p => !p);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  function handleNewTask() {
    setPage('tasks');
    // Give the page time to mount if navigating, then trigger new-task
    setTimeout(() => useTaskStore.getState().selectTask(null), 50);
  }

  async function finishTour(suppress: boolean) {
    setShowTour(false);
    if (suppress) ipc.settings.set('tour_suppressed', true);
    // Return to task editor with welcome task open
    setPage('tasks');
    const id = await ipc.tasks.ensureWelcomeTask() as number;
    await useTaskStore.getState().fetchAll();
    useTaskStore.getState().selectTask(id);
  }

  // Step 5 = task editor — open/create welcome task in current language
  async function handleTourStep(stepIdx: number) {
    if (stepIdx === 5) {
      const id = await ipc.tasks.ensureWelcomeTask() as number;
      await useTaskStore.getState().fetchAll();
      useTaskStore.getState().selectTask(id);
    }
  }

  function renderPage() {
    switch (page) {
      case 'tasks':     return <TasksPage />;
      case 'analytics': return <AnalyticsPage />;
      case 'calendar':  return <CalendarPage onNavigate={setPage} />;
      case 'finance':   return <FinancePage />;
      case 'settings':  return <SettingsPage onStartTour={() => setShowTour(true)} />;
    }
  }

  return (
    <DndProvider backend={HTML5Backend}>
    <ThemeProvider>
      {/* ── App shell — z-index:1 ── */}
      <div className="app-shell">
        {/* Glass titlebar strip with custom window controls */}
        <div
          className="glass-surface"
          style={{ height: 32, flexShrink: 0, display: 'flex', alignItems: 'center', WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
          <WindowControls />
        </div>

        {/* Main layout */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <AppSidebar currentPage={page} onNavigate={setPage} />
          <main className="flex-1 min-w-0 overflow-hidden">
            {renderPage()}
          </main>
        </div>
      </div>

      {/* ── Tour overlay ── */}
      {showTour && <TourOverlay currentPage={page} onNavigate={setPage} onDone={finishTour} onStepReady={handleTourStep} />}

      {/* ── Command palette (Ctrl+K) ── */}
      {showPalette && (
        <CommandPalette
          onClose={() => setShowPalette(false)}
          onNavigate={p => { setPage(p); setShowPalette(false); }}
          onNewTask={() => { handleNewTask(); setShowPalette(false); }}
        />
      )}

      {/* ── Launch overlay (splash) — sits above everything ── */}
      <LaunchOverlay ready={appReady} />
    </ThemeProvider>
    </DndProvider>
  );
}
