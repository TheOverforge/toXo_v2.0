import type Database from 'better-sqlite3';

export interface KpiData {
  total_completed: number;
  completion_pct: number;
  period_done: number;
  period_tasks: number;
  avg_hours: number;
  streak: number;
}

export class AnalyticsRepo {
  constructor(private db: Database.Database) {}

  private untilDefault(): string {
    // Far-future sentinel so "no until" means "up to now"
    return new Date().toISOString().replace(/\.\d{3}Z$/, '+00:00');
  }

  getCompletedPerDay(sinceIso: string, untilIso?: string): Array<[string, number]> {
    const until = untilIso ?? this.untilDefault();
    const rows = this.db.prepare(`
      SELECT DATE(completed_at, 'localtime') AS d, COUNT(*) AS cnt
      FROM tasks
      WHERE is_done = 1 AND completed_at IS NOT NULL AND completed_at >= ? AND completed_at <= ?
      GROUP BY d ORDER BY d
    `).all(sinceIso, until) as any[];
    return rows.map((r: any) => [r.d as string, r.cnt as number]);
  }

  getCreatedVsCompleted(sinceIso: string, untilIso?: string): Array<[string, number, number]> {
    const until = untilIso ?? this.untilDefault();
    const rows = this.db.prepare(`
      WITH created AS (
        SELECT DATE(created_at, 'localtime') AS d, COUNT(*) AS cnt
        FROM tasks WHERE created_at >= ? AND created_at <= ? GROUP BY d
      ),
      completed AS (
        SELECT DATE(completed_at, 'localtime') AS d, COUNT(*) AS cnt
        FROM tasks WHERE is_done=1 AND completed_at IS NOT NULL AND completed_at >= ? AND completed_at <= ? GROUP BY d
      ),
      dates AS (SELECT d FROM created UNION SELECT d FROM completed)
      SELECT dates.d, COALESCE(created.cnt,0) AS created, COALESCE(completed.cnt,0) AS completed
      FROM dates
      LEFT JOIN created ON dates.d = created.d
      LEFT JOIN completed ON dates.d = completed.d
      ORDER BY dates.d
    `).all(sinceIso, until, sinceIso, until) as any[];
    return rows.map((r: any) => [r.d as string, r.created as number, r.completed as number]);
  }

  getKpi(sinceIso: string, untilIso?: string): KpiData {
    const until = untilIso ?? this.untilDefault();

    const total_completed = ((this.db.prepare(
      'SELECT COUNT(*) FROM tasks WHERE is_done=1 AND completed_at >= ? AND completed_at <= ?'
    ).raw().get(sinceIso, until) as any)[0]) as number;

    const period_tasks = ((this.db.prepare(
      'SELECT COUNT(*) FROM tasks WHERE created_at >= ? AND created_at <= ?'
    ).raw().get(sinceIso, until) as any)[0]) as number;

    const period_done = ((this.db.prepare(
      'SELECT COUNT(*) FROM tasks WHERE created_at >= ? AND created_at <= ? AND is_done=1'
    ).raw().get(sinceIso, until) as any)[0]) as number;

    const completion_pct = period_tasks > 0 ? Math.round(period_done / period_tasks * 1000) / 10 : 0;

    const avgRow = this.db.prepare(`
      SELECT AVG((JULIANDAY(completed_at) - JULIANDAY(created_at)) * 24)
      FROM tasks
      WHERE is_done=1 AND completed_at IS NOT NULL AND completed_at >= ? AND completed_at <= ? AND created_at IS NOT NULL
    `).raw().get(sinceIso, until) as any;
    const avg_hours = avgRow[0] != null ? Math.round((avgRow[0] as number) * 10) / 10 : 0;

    const streakRows = this.db.prepare(`
      SELECT DISTINCT DATE(completed_at, 'localtime') AS d
      FROM tasks WHERE is_done=1 AND completed_at IS NOT NULL
      ORDER BY d DESC
    `).all() as any[];

    let streak = 0;
    if (streakRows.length > 0) {
      const today = new Date().toISOString().slice(0, 10);
      let expected = today;
      for (const row of streakRows) {
        const d = row.d as string;
        if (d === expected) {
          streak++;
          const date = new Date(expected);
          date.setDate(date.getDate() - 1);
          expected = date.toISOString().slice(0, 10);
        } else if (d < expected) {
          break;
        }
      }
    }

    return { total_completed, completion_pct, period_done, period_tasks, avg_hours, streak };
  }

  getStatusDistribution(sinceIso: string, untilIso?: string): { active: number; done: number } {
    const until = untilIso ?? this.untilDefault();
    const total = ((this.db.prepare('SELECT COUNT(*) FROM tasks WHERE created_at >= ? AND created_at <= ?').raw().get(sinceIso, until) as any)[0]) as number;
    const done = ((this.db.prepare('SELECT COUNT(*) FROM tasks WHERE created_at >= ? AND created_at <= ? AND is_done=1').raw().get(sinceIso, until) as any)[0]) as number;
    return { active: total - done, done };
  }

  getCompletedByWeekday(sinceIso: string, untilIso?: string): Array<[number, number]> {
    const until = untilIso ?? this.untilDefault();
    const rows = this.db.prepare(`
      SELECT CAST(strftime('%w', completed_at, 'localtime') AS INTEGER) AS dow, COUNT(*) AS cnt
      FROM tasks
      WHERE is_done=1 AND completed_at IS NOT NULL AND completed_at >= ? AND completed_at <= ?
      GROUP BY dow ORDER BY dow
    `).all(sinceIso, until) as any[];
    const result: Record<number, number> = {};
    for (const r of rows) {
      const dowMon = ((r.dow as number) - 1 + 7) % 7;
      result[dowMon] = (result[dowMon] || 0) + (r.cnt as number);
    }
    return Object.keys(result).sort().map(k => [Number(k), result[Number(k)]]);
  }

  getCompletedByCategory(sinceIso: string, untilIso?: string): Array<{ category_id: number | null; name: string; color: string; count: number }> {
    const until = untilIso ?? this.untilDefault();
    const rows = this.db.prepare(`
      SELECT t.category_id, c.name, c.color, COUNT(*) as cnt
      FROM tasks t
      LEFT JOIN categories c ON c.id = t.category_id
      WHERE t.is_done=1 AND t.completed_at IS NOT NULL AND t.completed_at >= ? AND t.completed_at <= ?
      GROUP BY t.category_id
      ORDER BY cnt DESC
    `).all(sinceIso, until) as any[];
    return rows.map((r: any) => ({
      category_id: r.category_id as number | null,
      name:  (r.name as string) || 'Без категории',
      color: (r.color as string) || '#98989d',
      count: r.cnt as number,
    }));
  }

  getPriorityDistribution(sinceIso: string, untilIso?: string): Array<{ priority: number; count: number }> {
    const until = untilIso ?? this.untilDefault();
    const rows = this.db.prepare(`
      SELECT priority, COUNT(*) as cnt
      FROM tasks WHERE created_at >= ? AND created_at <= ?
      GROUP BY priority ORDER BY priority
    `).all(sinceIso, until) as any[];
    return rows.map((r: any) => ({ priority: r.priority as number, count: r.cnt as number }));
  }
}
