import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDrop } from 'react-dnd';
import { useTheme } from '@/app/providers/ThemeProvider';
import { ipc } from '@/shared/api/ipc';
import { DND_TASK } from '@/widgets/task-sidebar/TaskList';
import {
  startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth,
  addMonths, subMonths, isToday, parseISO,
} from 'date-fns';
import { ru as ruLocale } from 'date-fns/locale';
import React, { useCallback } from 'react';
import type { Task } from '@/entities/task/model';
import { useTaskStore } from '@/entities/task/store';
import type { Page } from '@/app/App';

interface CalendarPageProps {
  onNavigate: (p: Page) => void;
}

export function CalendarPage({ onNavigate }: CalendarPageProps) {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const [month, setMonth]             = useState(new Date());
  const [tasksByDate, setTasksByDate] = useState<Record<string, Task[]>>({});
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [dayTasks, setDayTasks]       = useState<Task[]>([]);
  const [newTitle, setNewTitle]       = useState('');
  const [adding, setAdding]           = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle]   = useState('');
  const [saving, setSaving]           = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);

  const locale = i18n.language === 'ru' ? ruLocale : undefined;

  function taskCountLabel(count: number): string {
    if (i18n.language === 'ru') {
      if (count === 0) return t('calendar.no_tasks');
      if (count === 1) return `1 задача`;
      if (count < 5)  return `${count} задачи`;
      return `${count} задач`;
    }
    return count === 1 ? '1 task' : `${count} tasks`;
  }

  // Load tasks for today on mount
  useEffect(() => {
    ipc.tasks.getByDeadlineDate(todayStr).then(tasks => setDayTasks(tasks as Task[]));
  }, []);

  useEffect(() => {
    const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
    const map: Record<string, Task[]> = {};
    Promise.all(
      days.map(async d => {
        const ds = format(d, 'yyyy-MM-dd');
        const tasks = await ipc.tasks.getByDeadlineDate(ds);
        map[ds] = tasks as Task[];
      })
    ).then(() => setTasksByDate({ ...map }));
  }, [month]);

  // Focus edit input when editing starts
  useEffect(() => {
    if (editingTaskId !== null) {
      setTimeout(() => editInputRef.current?.focus(), 30);
    }
  }, [editingTaskId]);

  async function openDay(ds: string) {
    setSelectedDate(ds);
    const tasks = await ipc.tasks.getByDeadlineDate(ds);
    setDayTasks(tasks as Task[]);
    setNewTitle('');
    setEditingTaskId(null);
  }

  function startEditing(task: Task, e?: React.MouseEvent) {
    e?.stopPropagation();
    setEditingTaskId(task.id);
    setEditingTitle(task.title);
  }

  function cancelEditing() {
    setEditingTaskId(null);
    setEditingTitle('');
  }

  async function handleSaveEdit() {
    if (!editingTitle.trim() || editingTaskId === null) return;
    setSaving(true);
    try {
      await ipc.tasks.update(editingTaskId, { title: editingTitle.trim(), description: '' });
      const updated = await ipc.tasks.getByDeadlineDate(selectedDate);
      setDayTasks(updated as Task[]);
      setTasksByDate(prev => ({ ...prev, [selectedDate]: updated as Task[] }));
      useTaskStore.getState().fetchAll();
      cancelEditing();
    } finally {
      setSaving(false);
    }
  }

  async function handleAddTask() {
    if (!newTitle.trim() || !selectedDate) return;
    setAdding(true);
    try {
      const deadline = new Date(selectedDate + 'T12:00:00').toISOString();
      const id = await ipc.tasks.create({ title: newTitle.trim() });
      await ipc.tasks.setDeadline(id as number, deadline);
      const updated = await ipc.tasks.getByDeadlineDate(selectedDate);
      setDayTasks(updated as Task[]);
      setTasksByDate(prev => ({ ...prev, [selectedDate]: updated as Task[] }));
      setNewTitle('');
      useTaskStore.getState().fetchAll();
    } finally {
      setAdding(false);
    }
  }

  async function toggleDone(task: Task, e: React.MouseEvent) {
    e.stopPropagation();
    await ipc.tasks.setDone(task.id, !task.is_done);
    const updated = await ipc.tasks.getByDeadlineDate(selectedDate!);
    setDayTasks(updated as Task[]);
    setTasksByDate(prev => ({ ...prev, [selectedDate!]: updated as Task[] }));
    useTaskStore.getState().fetchAll();
  }

  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const firstDow = (days[0].getDay() + 6) % 7;
  const padded: (Date | null)[] = [...Array(firstDow).fill(null), ...days];
  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) weeks.push(padded.slice(i, i + 7));

  const DOW = t('analytics.weekdays', { returnObjects: true }) as string[];

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Calendar grid ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden px-4 py-4 gap-3">

        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0">
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>{t('calendar.title')}</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMonth(m => subMonths(m, 1))}
              className="flex items-center justify-center rounded-lg"
              style={{ width: 32, height: 32, background: 'var(--glass)', border: '1px solid var(--glass-border)', cursor: 'pointer', color: 'var(--text)', fontSize: 16 }}
            >‹</button>
            <span style={{ fontWeight: 600, fontSize: 15, minWidth: 148, textAlign: 'center', color: 'var(--text)' }}>
              {format(month, 'LLLL yyyy', { locale })}
            </span>
            <button
              onClick={() => setMonth(m => addMonths(m, 1))}
              className="flex items-center justify-center rounded-lg"
              style={{ width: 32, height: 32, background: 'var(--glass)', border: '1px solid var(--glass-border)', cursor: 'pointer', color: 'var(--text)', fontSize: 16 }}
            >›</button>
            <button
              onClick={() => { setMonth(new Date()); openDay(todayStr); }}
              className="px-3 rounded-lg text-sm"
              style={{ height: 32, background: 'var(--glass)', border: '1px solid var(--glass-border)', cursor: 'pointer', color: 'var(--text-sec)' }}
            >
              {t('calendar.today')}
            </button>
          </div>
        </div>

        {/* Grid */}
        <div data-tour="calendar-grid" className="flex-1 min-h-0 rounded-xl overflow-hidden flex flex-col" style={{ border: `1px solid ${isLight ? 'rgba(68,95,132,0.14)' : 'rgba(255,255,255,0.25)'}`, background: isLight ? 'rgba(244,248,255,0.48)' : undefined, backdropFilter: isLight ? 'blur(10px)' : undefined }}>

          {/* DOW header */}
          <div className="grid grid-cols-7 flex-shrink-0" style={{ borderBottom: `1px solid ${isLight ? 'rgba(68,95,132,0.10)' : 'rgba(255,255,255,0.22)'}`, background: isLight ? 'rgba(250,252,255,0.56)' : 'rgba(255,255,255,0.10)' }}>
            {DOW.map((d, i) => (
              <div key={d} className="text-center py-2"
                style={{
                  fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
                  color: i >= 5 ? (isLight ? 'rgba(32,130,255,0.9)' : 'rgba(10,132,255,0.7)') : 'var(--text-sec)',
                }}>
                {d}
              </div>
            ))}
          </div>

          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            {weeks.map((week, wi) => (
              <div key={wi} style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                {week.map((day, di) => {
                  if (!day) {
                    return <div key={di} style={{ background: isLight ? 'rgba(68,95,132,0.04)' : 'rgba(0,0,0,0.06)', borderRight: `1px solid ${isLight ? 'rgba(68,95,132,0.08)' : 'rgba(255,255,255,0.22)'}`, borderBottom: `1px solid ${isLight ? 'rgba(68,95,132,0.08)' : 'rgba(255,255,255,0.22)'}` }} />;
                  }
                  const ds = format(day, 'yyyy-MM-dd');
                  return (
                    <CalendarCell
                      key={ds}
                      day={day}
                      ds={ds}
                      tasks={tasksByDate[ds] || []}
                      isSelected={selectedDate === ds}
                      isLight={isLight}
                      month={month}
                      onOpen={() => openDay(ds)}
                      onStartEditing={(task, e) => { openDay(ds); startEditing(task, e); }}
                      onDropTask={async (taskId) => {
                        const deadline = new Date(ds + 'T12:00:00').toISOString();
                        await ipc.tasks.setDeadline(taskId, deadline);
                        const updatedMonth = { ...tasksByDate };
                        const updated = await ipc.tasks.getByDeadlineDate(ds);
                        updatedMonth[ds] = updated as Task[];
                        setTasksByDate(updatedMonth);
                        if (selectedDate === ds) setDayTasks(updated as Task[]);
                        useTaskStore.getState().fetchAll();
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Day detail panel ── */}
      <div
        className="glass-surface flex flex-col"
        style={{ width: 288, flexShrink: 0, borderRadius: 0, overflow: 'hidden' }}
      >
        {/* Panel header */}
        <div className="px-5 pt-5 pb-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--separator)' }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-sec)', marginBottom: 6 }}>
            {format(parseISO(selectedDate), 'EEEE', { locale })}
          </p>
          <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>
            {format(parseISO(selectedDate), 'd MMMM', { locale })}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-sec)', marginTop: 4 }}>
            {taskCountLabel(dayTasks.length)}
          </p>
        </div>

        {/* Tasks list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1.5">
          {dayTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2" style={{ opacity: 0.5 }}>
              <span style={{ fontSize: 28 }}>📅</span>
              <p style={{ fontSize: 13, color: 'var(--text-sec)', textAlign: 'center' }}>{t('calendar.no_tasks_day')}</p>
            </div>
          ) : (
            dayTasks.map(task => (
              <div
                key={task.id}
                onClick={() => startEditing(task)}
                className="task-card flex items-center gap-2.5 px-3 py-2 rounded-xl"
                style={{
                  background: editingTaskId === task.id
                    ? (isLight ? 'rgba(32,130,255,0.12)' : 'rgba(10,132,255,0.20)')
                    : 'var(--glass)',
                  border: `1px solid ${editingTaskId === task.id ? 'var(--accent)' : task.is_done ? 'transparent' : 'var(--glass-border)'}`,
                  opacity: task.is_done ? 0.5 : 1,
                  cursor: 'pointer',
                }}
              >
                <button
                  onClick={e => toggleDone(task, e)}
                  className="rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    width: 17, height: 17,
                    border: `1.5px solid ${task.is_done ? 'var(--accent)' : isLight ? 'rgba(0,0,0,0.40)' : 'var(--glass-border)'}`,
                    background: task.is_done ? 'var(--accent)' : 'transparent',
                    cursor: 'pointer', fontSize: 9, color: '#fff',
                  }}
                >
                  {task.is_done && '✓'}
                </button>
                <span
                  className="text-sm flex-1 min-w-0 truncate"
                  style={{
                    color: task.is_done ? 'var(--text-sec)' : 'var(--text)',
                    textDecoration: task.is_done ? 'line-through' : 'none',
                    fontWeight: 500,
                  }}
                >
                  {task.title}
                </span>
                {editingTaskId !== task.id && (
                  <div className="flex items-center gap-1" style={{ flexShrink: 0 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-sec)', opacity: 0.6 }}>✎</span>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        useTaskStore.getState().selectTask(task.id);
                        onNavigate('tasks');
                      }}
                      title={t('calendar.open_in_tasks')}
                      style={{
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        padding: '1px 3px', borderRadius: 4, lineHeight: 1,
                        color: 'var(--text-sec)', opacity: 0.5, fontSize: 13,
                        transition: 'opacity 0.12s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}
                    >
                      ↗
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Add / Edit task */}
        <div className="px-3 pb-3 pt-2 flex-shrink-0" style={{ borderTop: '1px solid var(--separator)' }}>
          {editingTaskId !== null ? (
            /* ── Edit mode ── */
            <>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8 }}>
                {t('calendar.edit_task')}
              </p>
              <div className="flex gap-2 mb-2">
                <input
                  ref={editInputRef}
                  value={editingTitle}
                  onChange={e => setEditingTitle(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveEdit();
                    if (e.key === 'Escape') cancelEditing();
                  }}
                  className="flex-1 outline-none"
                  style={{
                    height: 32, borderRadius: 'var(--radius-md)', padding: '0 10px',
                    background: 'var(--glass)', color: 'var(--text)',
                    border: '1px solid var(--accent)', minWidth: 0, fontSize: 13,
                  }}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  disabled={saving || !editingTitle.trim()}
                  style={{
                    flex: 1, height: 30, borderRadius: 'var(--radius-md)',
                    background: 'var(--accent)', border: 'none', cursor: 'pointer',
                    color: '#fff', fontSize: 13, fontWeight: 600,
                    opacity: saving || !editingTitle.trim() ? 0.4 : 1,
                  }}
                >
                  {t('calendar.save')}
                </button>
                <button
                  onClick={cancelEditing}
                  style={{
                    flex: 1, height: 30, borderRadius: 'var(--radius-md)',
                    background: 'var(--glass)', border: '1px solid var(--glass-border)',
                    cursor: 'pointer', color: 'var(--text-sec)', fontSize: 13,
                  }}
                >
                  {t('calendar.cancel')}
                </button>
              </div>
            </>
          ) : (
            /* ── Add mode ── */
            <>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-sec)', marginBottom: 8 }}>
                {t('calendar.add_task')}
              </p>
              <div className="flex gap-2">
                <input
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddTask(); }}
                  placeholder={t('calendar.task_placeholder')}
                  className="flex-1 outline-none"
                  style={{
                    height: 32, borderRadius: 'var(--radius-md)', padding: '0 10px',
                    background: 'var(--glass)', color: 'var(--text)',
                    border: '1px solid var(--glass-border)', minWidth: 0, fontSize: 13,
                  }}
                />
                <button
                  onClick={handleAddTask}
                  disabled={adding || !newTitle.trim()}
                  style={{
                    height: 32, width: 32, borderRadius: 'var(--radius-md)',
                    background: 'var(--accent)', border: 'none', cursor: 'pointer',
                    color: '#fff', fontSize: 18, fontWeight: 700, flexShrink: 0,
                    opacity: adding || !newTitle.trim() ? 0.4 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  +
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── CalendarCell — drop target ────────────────────────────────────────────────
interface CalendarCellProps {
  day: Date;
  ds: string;
  tasks: Task[];
  isSelected: boolean;
  isLight: boolean;
  month: Date;
  onOpen: () => void;
  onStartEditing: (task: Task, e: React.MouseEvent) => void;
  onDropTask: (taskId: number) => Promise<void>;
}

function CalendarCell({ day, ds, tasks, isSelected, isLight, month, onOpen, onStartEditing, onDropTask }: CalendarCellProps) {
  const [{ isOver, canDrop }, dropRef] = useDrop(() => ({
    accept: DND_TASK,
    drop: (item: { id: number }) => { void onDropTask(item.id); },
    collect: monitor => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }), [onDropTask]);

  const today   = isToday(day);
  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
  const inMonth = isSameMonth(day, month);
  const dropping = isOver && canDrop;

  return (
    <div
      ref={dropRef as any}
      onClick={onOpen}
      className={`cal-cell flex flex-col overflow-hidden cursor-pointer${isSelected ? ' cal-cell--selected' : ''}`}
      style={{
        padding: '6px 6px 4px',
        background: dropping
          ? (isLight ? 'rgba(32,130,255,0.22)' : 'rgba(10,132,255,0.28)')
          : isSelected
            ? (isLight ? 'rgba(32,130,255,0.12)' : 'rgba(10,132,255,0.18)')
            : today
              ? (isLight ? 'rgba(32,130,255,0.06)' : 'rgba(10,132,255,0.07)')
              : 'transparent',
        borderRight: `1px solid ${isLight ? 'rgba(68,95,132,0.08)' : 'rgba(255,255,255,0.22)'}`,
        borderBottom: `1px solid ${isLight ? 'rgba(68,95,132,0.08)' : 'rgba(255,255,255,0.22)'}`,
        boxShadow: dropping
          ? `inset 0 0 0 2px var(--accent)`
          : isSelected && isLight ? 'inset 0 0 0 1px rgba(32,130,255,0.28)' : undefined,
        borderTop: isSelected ? '2px solid var(--accent)' : today ? `2px solid ${isLight ? 'var(--accent)' : 'rgba(10,132,255,0.5)'}` : 'none',
        opacity: inMonth ? 1 : 0.4,
        transition: 'background 0.1s, box-shadow 0.1s',
      }}
    >
      {/* Day number */}
      <span
        className="self-start flex-shrink-0"
        style={{
          fontSize: 13, fontWeight: today || isSelected ? 700 : 500,
          lineHeight: 1,
          width: 22, height: 22,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: '50%',
          background: today ? 'var(--accent)' : isSelected && isLight ? 'rgba(32,130,255,0.14)' : 'transparent',
          color: today ? '#fff' : isSelected ? 'var(--accent)' : isWeekend ? (isLight ? '#1a6fcc' : 'rgba(10,132,255,0.8)') : 'var(--text)',
          marginBottom: 4,
        }}
      >
        {format(day, 'd')}
      </span>

      {/* Event chips */}
      {tasks.slice(0, 2).map(task => (
        <div
          key={task.id}
          onClick={e => onStartEditing(task, e)}
          className="truncate flex-shrink-0"
          style={{
            fontSize: 11, fontWeight: 500,
            padding: '2px 5px',
            borderRadius: 5,
            marginBottom: 2,
            background: task.is_done
              ? (isLight ? 'rgba(34,168,97,0.16)' : 'rgba(48,209,88,0.20)')
              : (isLight ? 'rgba(32,130,255,0.18)' : 'rgba(10,132,255,0.25)'),
            color: task.is_done
              ? (isLight ? '#1a6b3c' : '#fff')
              : (isLight ? '#0f3e79' : '#fff'),
            borderLeft: `2px solid ${task.is_done ? (isLight ? '#22a861' : '#30d158') : 'var(--accent)'}`,
            textDecoration: task.is_done ? 'line-through' : 'none',
            cursor: 'pointer',
          }}
        >
          {task.title}
        </div>
      ))}
      {tasks.length > 2 && (
        <span style={{ fontSize: 10, color: 'var(--text-sec)', paddingLeft: 2 }}>
          +{tasks.length - 2}
        </span>
      )}
    </div>
  );
}
