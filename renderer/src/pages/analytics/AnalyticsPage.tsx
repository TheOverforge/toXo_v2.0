import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/app/providers/ThemeProvider';
import { ipc } from '@/shared/api/ipc';
import { subDays, formatISO, format } from 'date-fns';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';

type Period = '7d' | '30d' | '90d' | 'custom';

function periodToSince(period: Exclude<Period, 'custom'>): string {
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  return formatISO(subDays(new Date(), days), { representation: 'date' }) + 'T00:00:00+00:00';
}

export function AnalyticsPage() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [period, setPeriod] = useState<Period>('30d');

  // custom range
  const defaultFrom = format(subDays(new Date(), 29), 'yyyy-MM-dd');
  const defaultUntil = format(new Date(), 'yyyy-MM-dd');
  const [customFrom, setCustomFrom] = useState(defaultFrom);
  const [customUntil, setCustomUntil] = useState(defaultUntil);
  const [appliedFrom, setAppliedFrom] = useState(defaultFrom);
  const [appliedUntil, setAppliedUntil] = useState(defaultUntil);

  const [kpi, setKpi] = useState<any>(null);
  const [trend, setTrend] = useState<[string, number, number][]>([]);
  const [weekday, setWeekday] = useState<[number, number][]>([]);
  const [status, setStatus] = useState<{ active: number; done: number } | null>(null);
  const [byCategory, setByCategory] = useState<any[]>([]);

  function loadData(sinceIso: string, untilIso?: string) {
    Promise.all([
      ipc.analytics.getKpi(sinceIso, untilIso),
      ipc.analytics.createdVsCompleted(sinceIso, untilIso),
      ipc.analytics.completedByWeekday(sinceIso, untilIso),
      ipc.analytics.statusDistribution(sinceIso, untilIso),
      ipc.analytics.completedByCategory(sinceIso, untilIso),
    ]).then(([k, tr, wd, st, bc]) => {
      setKpi(k);
      setTrend(tr as [string, number, number][]);
      setWeekday(wd as [number, number][]);
      setStatus(st as any);
      setByCategory(bc as any[]);
    });
  }

  useEffect(() => {
    if (period !== 'custom') {
      loadData(periodToSince(period));
    }
  }, [period]);

  // When period switches to custom, load with current applied range
  useEffect(() => {
    if (period === 'custom') {
      loadData(appliedFrom + 'T00:00:00+00:00', appliedUntil + 'T23:59:59+00:00');
    }
  }, [period]);

  const CHART_COMPLETED = isLight ? '#0d9488' : 'var(--accent)';
  const CHART_CREATED   = isLight ? '#64748b' : 'rgba(255,255,255,0.25)';

  const WEEKDAYS = t('analytics.weekdays', { returnObjects: true }) as string[];
  const trendData = trend.map(([d, c, done]) => ({ date: d.slice(5), created: c, completed: done }));
  const weekdayData = WEEKDAYS.map((label, i) => ({
    label,
    count: weekday.find(([d]) => d === i)?.[1] ?? 0,
  }));
  const statusData = status
    ? [
        { name: t('analytics.active'), value: status.active, fill: CHART_COMPLETED },
        { name: t('analytics.done'),   value: status.done,   fill: isLight ? '#15803d' : '#30d158' },
      ]
    : [];

  const insights = useMemo(() => {
    if (!kpi) return [];
    const list: { label: string; value: string }[] = [];

    if (weekdayData.some(d => d.count > 0)) {
      const bestIdx = weekdayData.reduce((bi, d, i, a) => d.count > a[bi].count ? i : bi, 0);
      list.push({ label: t('analytics.insight_best_day'), value: WEEKDAYS[bestIdx] });
    }
    if (byCategory.length > 0) {
      const top = byCategory[0];
      list.push({ label: t('analytics.insight_top_category'), value: `${top.name || t('analytics.insight_no_category')} · ${top.count}` });
    }
    if (kpi.avg_hours > 0) {
      const h = kpi.avg_hours;
      list.push({ label: t('analytics.insight_avg_time'), value: h < 24 ? `${h}h` : `${Math.round(h / 24)}d` });
    }
    if (kpi.streak > 0) {
      const s = kpi.streak;
      const daysKey = s === 1 ? 'insight_streak_days_one' : s < 5 ? 'insight_streak_days_few' : 'insight_streak_days_many';
      list.push({ label: t('analytics.insight_streak'), value: `${s} ${t(`analytics.${daysKey}`)}` });
    }
    if (kpi.period_tasks > 0) {
      list.push({ label: t('analytics.insight_done_of'), value: `${kpi.total_completed} / ${kpi.period_tasks}` });
    }
    return list;
  }, [kpi, weekdayData, byCategory, t]);

  const total = statusData.reduce((s, d) => s + d.value, 0);
  const donePct = total > 0 ? Math.round((status?.done ?? 0) / total * 100) : 0;

  const allPeriods: Period[] = ['7d', '30d', '90d', 'custom'];

  return (
    <div className="flex flex-col h-full overflow-y-auto px-6 py-4 gap-5">

      {/* ── Header ── */}
      <div data-tour="analytics-header" className="flex items-center justify-between flex-shrink-0 flex-wrap gap-2">
        <h1 className="text-xl font-bold">{t('analytics.title')}</h1>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Period buttons */}
          <div
            className="flex gap-0.5 p-1 rounded-lg"
            style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)' }}
          >
            {allPeriods.map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className="px-3 py-1 rounded-md text-sm transition-all"
                style={{
                  border: 'none', cursor: 'pointer',
                  background: period === p ? 'var(--accent)' : 'transparent',
                  color: period === p ? '#fff' : 'var(--text-sec)',
                }}
              >
                {t(`analytics.period_${p}` as any)}
              </button>
            ))}
          </div>

          {/* Custom range inputs */}
          {period === 'custom' && (
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 12, color: 'var(--text-sec)' }}>{t('analytics.custom_from')}</span>
              <input
                type="date"
                value={customFrom}
                onChange={e => setCustomFrom(e.target.value)}
                max={customUntil}
                className="rounded-md px-2 py-1 text-sm"
                style={{
                  background: 'var(--glass)', border: '1px solid var(--glass-border)',
                  color: 'var(--text)', outline: 'none',
                }}
              />
              <span style={{ fontSize: 12, color: 'var(--text-sec)' }}>{t('analytics.custom_to')}</span>
              <input
                type="date"
                value={customUntil}
                onChange={e => setCustomUntil(e.target.value)}
                min={customFrom}
                max={format(new Date(), 'yyyy-MM-dd')}
                className="rounded-md px-2 py-1 text-sm"
                style={{
                  background: 'var(--glass)', border: '1px solid var(--glass-border)',
                  color: 'var(--text)', outline: 'none',
                }}
              />
              <button
                onClick={() => {
                  setAppliedFrom(customFrom);
                  setAppliedUntil(customUntil);
                  loadData(customFrom + 'T00:00:00+00:00', customUntil + 'T23:59:59+00:00');
                }}
                className="px-3 py-1 rounded-md text-sm"
                style={{ background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer' }}
              >
                {t('analytics.custom_apply')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── KPI row ── */}
      {kpi && (
        <div className="grid grid-cols-4 gap-3 flex-shrink-0">
          <KpiCard
            label={t('analytics.completed')}
            value={kpi.total_completed}
            sub={kpi.period_tasks > 0 ? t('analytics.kpi_of_created', { n: kpi.period_tasks }) : undefined}
          />
          <KpiCard
            label={t('analytics.completion_pct')}
            value={`${kpi.completion_pct}%`}
            sub={kpi.completion_pct >= 70 ? t('analytics.kpi_completion_great') : kpi.completion_pct >= 40 ? t('analytics.kpi_completion_good') : t('analytics.kpi_completion_low')}
            valueColor={kpi.completion_pct >= 70 ? (isLight ? '#15803d' : '#30d158') : kpi.completion_pct >= 40 ? 'var(--text)' : (isLight ? '#c2410c' : 'var(--accent)')}
          />
          <KpiCard
            label={t('analytics.avg_hours')}
            value={kpi.avg_hours > 0 ? `${kpi.avg_hours}h` : '—'}
            sub={t('analytics.kpi_avg_sub')}
          />
          <KpiCard
            label={t('analytics.streak')}
            value={kpi.streak}
            sub={kpi.streak > 0 ? t('analytics.kpi_streak_active') : t('analytics.kpi_streak_start')}
            valueColor={kpi.streak > 2 ? '#ff9f0a' : 'var(--text)'}
          />
        </div>
      )}

      {/* ── Main trend chart ── */}
      <div className="glass-card px-4 py-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <p style={{ color: 'var(--text)', fontSize: 14, fontWeight: 600 }}>
            {t('analytics.chart_trend')}
          </p>
          <div className="flex items-center gap-5">
            <LineLegend color={CHART_COMPLETED} label={t('analytics.completed')} />
            <LineLegend color={CHART_CREATED}   label={t('analytics.created')} />
          </div>
        </div>
        {trendData.length === 0 ? (
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: 'var(--text-sec)', fontSize: 13 }}>{t('analytics.no_data')}</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData}>
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--text-sec)' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-sec)' }} tickLine={false} axisLine={false} allowDecimals={false} width={24} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-combo)', border: '1px solid var(--glass-border)', borderRadius: 8, fontSize: 12, color: 'var(--text)' }}
                cursor={{ stroke: 'var(--glass-border)', strokeWidth: 1 }}
              />
              <Line type="monotone" dataKey="created"   stroke={CHART_CREATED}    strokeWidth={1.5} dot={false} name={t('analytics.created')} />
              <Line type="monotone" dataKey="completed" stroke={CHART_COMPLETED}  strokeWidth={2.5} dot={false} name={t('analytics.completed')} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Second row: weekday + status ── */}
      <div className="grid grid-cols-2 gap-4 flex-shrink-0">
        <ChartCard title={t('analytics.chart_weekday')}>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={weekdayData} barCategoryGap="35%">
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--text-sec)' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-sec)' }} tickLine={false} axisLine={false} allowDecimals={false} width={20} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-combo)', border: '1px solid var(--glass-border)', borderRadius: 8, fontSize: 12, color: 'var(--text)' }}
                cursor={{ fill: isLight ? 'rgba(74,103,140,0.07)' : 'rgba(255,255,255,0.04)' }}
              />
              <Bar dataKey="count" fill={CHART_COMPLETED} radius={[4, 4, 0, 0]} name={t('analytics.completed')} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('analytics.chart_status')}>
          {statusData.length === 0 || total === 0 ? (
            <div style={{ height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ color: 'var(--text-sec)', fontSize: 13 }}>{t('analytics.no_data')}</p>
            </div>
          ) : (
            <>
              <div style={{ position: 'relative', width: '100%', height: 120 }}>
                <ResponsiveContainer width="100%" height={120}>
                  <PieChart>
                    <Pie
                      data={statusData} dataKey="value"
                      innerRadius={40} outerRadius={56}
                      paddingAngle={4} cornerRadius={5}
                      stroke="none" startAngle={90} endAngle={-270}
                    >
                      {statusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-combo)', border: '1px solid var(--glass-border)', borderRadius: 8, fontSize: 12, color: 'var(--text)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center', pointerEvents: 'none',
                }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{donePct}%</div>
                  <div style={{ fontSize: 11, color: 'var(--text-sec)', marginTop: 3 }}>{t('analytics.done_label')}</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 6 }}>
                {statusData.map((entry, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: entry.fill }} />
                    <span style={{ fontSize: 12, color: 'var(--text)' }}>
                      {entry.name}: <strong>{entry.value}</strong>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </ChartCard>
      </div>

      {/* ── Bottom row: insights + categories ── */}
      {(insights.length > 0 || byCategory.length > 0) && (
        <div className="grid grid-cols-2 gap-4 flex-shrink-0">
          {insights.length > 0 && (
            <ChartCard title={t('analytics.insights')}>
              <div className="flex flex-col gap-3">
                {insights.map((ins, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-sec)' }}>{ins.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>{ins.value}</span>
                  </div>
                ))}
              </div>
            </ChartCard>
          )}
          {byCategory.length > 0 && (
            <ChartCard title={t('analytics.chart_category')}>
              <div className="flex flex-col gap-2.5">
                {byCategory.slice(0, 6).map((item: any) => (
                  <div key={item.category_id ?? 'none'} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color || 'var(--text-sec)', flexShrink: 0, display: 'inline-block' }} />
                    <span style={{ fontSize: 12, color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.name || t('analytics.insight_no_category')}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: Math.max(16, Math.round((item.count / byCategory[0].count) * 64)),
                        height: 4, borderRadius: 2,
                        background: item.color || 'var(--accent)', opacity: 0.7,
                      }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', minWidth: 18, textAlign: 'right' }}>
                        {item.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>
          )}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, valueColor }: {
  label: string; value: any; sub?: string; valueColor?: string;
}) {
  return (
    <div className="glass-card px-4 py-3 flex flex-col gap-1">
      <p style={{ color: 'var(--text-sec)', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </p>
      <p style={{ color: valueColor ?? 'var(--text)', fontSize: 34, fontWeight: 700, lineHeight: 1 }}>
        {value}
      </p>
      {sub && (
        <p style={{ color: 'var(--text-sec)', fontSize: 11, marginTop: 1 }}>{sub}</p>
      )}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card px-4 py-3">
      <p style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600, marginBottom: 12, opacity: 0.9 }}>{title}</p>
      {children}
    </div>
  );
}

function LineLegend({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 16, height: 2, borderRadius: 1, background: color }} />
      <span style={{ fontSize: 11, color: 'var(--text-sec)' }}>{label}</span>
    </div>
  );
}
