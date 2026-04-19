import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/app/providers/ThemeProvider';
import { ipc } from '@/shared/api/ipc';
import type { FinAccount, Transaction, Budget, Goal } from '@/entities/finance/model';
import { format, subDays } from 'date-fns';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

export function FinancePage() {
  const { t } = useTranslation();
  const [accounts, setAccounts]     = useState<FinAccount[]>([]);
  const [transactions, setTxs]      = useState<Transaction[]>([]);
  const [budgets, setBudgets]       = useState<Budget[]>([]);
  const [goals, setGoals]           = useState<Goal[]>([]);
  const [summary, setSummary]       = useState<any>(null);
  const [balanceTrend, setBalance]  = useState<any[]>([]);
  const [expByCat, setExpByCat]     = useState<any[]>([]);
  const [totalBalance, setTotal]    = useState<Record<string, number>>({});

  // Quick-add transaction state
  const [txAmount, setTxAmount]       = useState('');
  const [txType, setTxType]           = useState<'income' | 'expense' | 'transfer'>('expense');
  const [txAccountId, setTxAccount]   = useState<number | ''>('');
  const [txToAccountId, setTxToAccount] = useState<number | ''>('');
  const [txBusy, setTxBusy]           = useState(false);

  useEffect(() => {
    const until = format(new Date(), 'yyyy-MM-dd');
    const since = format(subDays(new Date(), 29), 'yyyy-MM-dd');

    Promise.all([
      ipc.finance.accounts.list(),
      ipc.finance.transactions.list({ limit: 100 }),
      ipc.finance.budgets.list(),
      ipc.finance.goals.list(),
      ipc.finance.transactions.summary(since, until),
      ipc.finance.transactions.cumulativeBalance(since, until),
      ipc.finance.transactions.expenseByCategory(since, until),
      ipc.finance.transactions.totalBalance(),
    ]).then(([acc, txs, bud, gls, sum, bal, exp, tot]) => {
      setAccounts(acc as FinAccount[]);
      setTxs(txs as Transaction[]);
      setBudgets(bud as Budget[]);
      setGoals(gls as Goal[]);
      setSummary(sum);
      setBalance((bal as [string, number][]).map(([d, v]) => ({ date: d.slice(5), balance: Math.round(v) })));
      setExpByCat(exp as any[]);
      setTotal(tot as Record<string, number>);
    });

    const onReload = () => reload();
    window.addEventListener('finance:reload', onReload);
    return () => window.removeEventListener('finance:reload', onReload);
  }, []);

  function reload() {
    const until = format(new Date(), 'yyyy-MM-dd');
    const since = format(subDays(new Date(), 29), 'yyyy-MM-dd');
    Promise.all([
      ipc.finance.accounts.list(),
      ipc.finance.transactions.list({ limit: 100 }),
      ipc.finance.budgets.list(),
      ipc.finance.goals.list(),
      ipc.finance.transactions.summary(since, until),
      ipc.finance.transactions.cumulativeBalance(since, until),
      ipc.finance.transactions.expenseByCategory(since, until),
      ipc.finance.transactions.totalBalance(),
    ]).then(([acc, txs, bud, gls, sum, bal, exp, tot]) => {
      setAccounts(acc as FinAccount[]);
      setTxs(txs as Transaction[]);
      setBudgets(bud as Budget[]);
      setGoals(gls as Goal[]);
      setSummary(sum);
      setBalance((bal as [string, number][]).map(([d, v]) => ({ date: d.slice(5), balance: Math.round(v) })));
      setExpByCat(exp as any[]);
      setTotal(tot as Record<string, number>);
    });
  }

  async function handleAddTx() {
    const amount = parseFloat(txAmount);
    if (!amount || amount <= 0 || txAccountId === '') return;
    const acc = accounts.find(a => a.id === txAccountId);
    if (!acc) return;
    setTxBusy(true);
    try {
      if (txType === 'transfer') {
        if (txToAccountId === '' || txToAccountId === txAccountId) return;
        await ipc.finance.transactions.transfer({
          from_account_id: txAccountId,
          to_account_id: txToAccountId,
          amount,
          currency: acc.currency,
          date: format(new Date(), 'yyyy-MM-dd'),
          title: 'Transfer',
        });
      } else {
        await ipc.finance.transactions.add({
          type: txType,
          amount,
          currency: acc.currency,
          account_id: txAccountId,
          category_id: null,
          date: format(new Date(), 'yyyy-MM-dd'),
          title: '',
          note: '',
          tags: '',
          is_recurring: false,
          recurring_rule: null,
        });
      }
      setTxAmount('');
      reload();
    } finally {
      setTxBusy(false);
    }
  }

  const { theme } = useTheme();
  const isLight = theme === 'light';
  const COLORS = ['#2082ff', '#22a861', '#c07c1a', '#8a44c8', '#df5252', '#3a8fc8'];

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar: accounts (scrollable) + quick-add (pinned at bottom) */}
      <div
        className="glass-surface flex flex-col"
        style={{ width: 230, flexShrink: 0, borderRadius: 0, overflow: 'hidden' }}
      >
        {/* Scrollable accounts area */}
        <div className="flex flex-col gap-2 p-3 overflow-y-auto flex-1 min-h-0">
          <h2 className="text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>{t('finance.accounts')}</h2>
          {accounts.map(acc => (
            <div key={acc.id} className="glass-card px-3 py-2">
              <div className="flex items-center gap-2">
                <span
                  className="rounded-full"
                  style={{ width: 8, height: 8, background: acc.color, flexShrink: 0 }}
                />
                <span className="text-sm truncate">{acc.name}</span>
              </div>
              <p className="text-base font-bold mt-0.5">
                {acc.balance.toLocaleString()} {acc.currency}
              </p>
            </div>
          ))}

          <div style={{ borderTop: '1px solid var(--separator)', marginTop: 4 }} />
          <h2 className="text-sm font-bold" style={{ color: 'var(--text)' }}>{t('finance.total')}</h2>
          {Object.entries(totalBalance).map(([cur, val]) => (
            <p key={cur} className="text-base font-bold" style={{ color: 'var(--accent)' }}>
              {Math.round(val).toLocaleString()} {cur}
            </p>
          ))}
        </div>

        {/* ── Quick-add transaction — pinned at bottom ── */}
        <div data-tour="finance-quickadd" style={{ borderTop: '1px solid var(--separator)', padding: '10px 12px', flexShrink: 0 }}>
          <h2 className="text-sm font-bold mb-2" style={{ color: 'var(--text)' }}>{t('common.add')}</h2>

          {/* Income / Expense / Transfer toggle */}
          <div className="flex gap-1 mb-2">
            {(['income', 'expense', 'transfer'] as const).map(tp => (
              <button
                key={tp}
                onClick={() => setTxType(tp)}
                style={{
                  flex: 1, padding: '4px 0', fontSize: 10, fontWeight: 600,
                  borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: txType === tp
                    ? tp === 'income' ? (isLight ? 'var(--success)' : '#30d158')
                    : tp === 'expense' ? 'var(--danger)'
                    : 'var(--accent)'
                    : 'var(--glass)',
                  color: txType === tp ? '#fff' : 'var(--text)',
                }}
              >
                {tp === 'income' ? '＋' : tp === 'expense' ? '－' : '⇄'}
                {' '}
                {tp === 'income' ? t('finance.income_btn') : tp === 'expense' ? t('finance.expense_btn') : t('finance.transfer_btn')}
              </button>
            ))}
          </div>

          {/* Amount input */}
          <input
            type="number"
            placeholder={t('finance.amount')}
            value={txAmount}
            onChange={e => setTxAmount(e.target.value)}
            style={{
              width: '100%', padding: '6px 8px', fontSize: 14, fontWeight: 700,
              background: 'var(--glass)', border: '1px solid var(--glass-border)',
              borderRadius: 8, color: 'var(--text)', marginBottom: 6,
              textAlign: 'center',
            }}
          />

          {/* Account selector (from) */}
          <select
            value={txAccountId}
            onChange={e => setTxAccount(e.target.value ? Number(e.target.value) : '')}
            style={{
              width: '100%', padding: '5px 8px', fontSize: 12,
              background: 'var(--bg-combo)', border: '1px solid var(--glass-border)',
              borderRadius: 8, color: 'var(--text)', marginBottom: txType === 'transfer' ? 4 : 8,
            }}
          >
            <option value="">{txType === 'transfer' ? t('finance.transfer_from') : t('finance.account_select')}</option>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>
            ))}
          </select>

          {/* To account selector (transfer only) */}
          {txType === 'transfer' && (
            <select
              value={txToAccountId}
              onChange={e => setTxToAccount(e.target.value ? Number(e.target.value) : '')}
              style={{
                width: '100%', padding: '5px 8px', fontSize: 12,
                background: 'var(--bg-combo)', border: '1px solid var(--glass-border)',
                borderRadius: 8, color: 'var(--text)', marginBottom: 8,
              }}
            >
              <option value="">{t('finance.transfer_to')}</option>
              {accounts.filter(a => a.id !== txAccountId).map(a => (
                <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>
              ))}
            </select>
          )}

          <button
            onClick={handleAddTx}
            disabled={txBusy || !txAmount || txAccountId === '' || (txType === 'transfer' && (txToAccountId === '' || txToAccountId === txAccountId))}
            style={{
              width: '100%', padding: '7px', fontSize: 13, fontWeight: 600,
              borderRadius: 8, border: 'none', cursor: 'pointer',
              background: txType === 'transfer' ? 'var(--accent)' : txType === 'income' ? (isLight ? 'var(--success)' : '#30d158') : 'var(--danger)',
              color: '#fff',
              opacity: txBusy || !txAmount || txAccountId === '' || (txType === 'transfer' && (txToAccountId === '' || txToAccountId === txAccountId)) ? 0.5 : 1,
            }}
          >
            {t('common.add')}
          </button>
        </div>
      </div>  {/* end sidebar */}

      {/* Main content */}
      <div className="flex-1 min-w-0 overflow-y-auto px-5 py-4 flex flex-col gap-4">
        {/* Summary cards */}
        {summary && (
          <div className="grid grid-cols-3 gap-3">
            <FinKpiCard label={t('finance.income')}   value={`${Math.round(summary.income).toLocaleString()} ₽`} color={isLight ? 'var(--success)' : '#30d158'} />
            <FinKpiCard label={t('finance.expenses')} value={`${Math.round(summary.expenses).toLocaleString()} ₽`} color="var(--danger)" />
            <FinKpiCard label={t('finance.balance')}  value={`${Math.round(summary.net).toLocaleString()} ₽`} color="var(--accent)" />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {/* Balance trend */}
          <div className="glass-card px-4 py-3">
            <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>{t('finance.balance_30d')}</p>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={balanceTrend}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-sec)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-sec)' }} />
                <Tooltip contentStyle={{ background: 'var(--bg-combo)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text)' }} />
                <Line type="monotone" dataKey="balance" stroke="var(--accent)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Expense by category */}
          <div className="glass-card px-4 py-3">
            <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>{t('finance.expenses_by_cat')}</p>
            {expByCat.length === 0 ? (
              <p style={{ color: 'var(--text-sec)', fontSize: 13 }}>{t('finance.no_data')}</p>
            ) : (() => {
              const totalExp = expByCat.reduce((s, e) => s + e.total, 0);
              return (
                <>
                  <div style={{ position: 'relative', width: '100%', height: 170 }}>
                    <ResponsiveContainer width="100%" height={170}>
                      <PieChart>
                        <Pie
                          data={expByCat.map(e => ({ name: e.name, value: Math.round(e.total) }))}
                          dataKey="value" nameKey="name"
                          innerRadius={50} outerRadius={76}
                          paddingAngle={4} cornerRadius={6}
                          stroke="none" startAngle={90} endAngle={-270}
                        >
                          {expByCat.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip
                          formatter={(v: any) => [`${v.toLocaleString()} ₽`, '']}
                          contentStyle={{ background: 'var(--bg-combo)', border: '1px solid var(--glass-border)', borderRadius: 10, fontSize: 12, color: 'var(--text)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{
                      position: 'absolute', top: '50%', left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center', pointerEvents: 'none',
                    }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>
                        {Math.round(totalExp).toLocaleString()}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-sec)', marginTop: 4 }}>{t('finance.expenses_label')}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', marginTop: 8, justifyContent: 'center' }}>
                    {expByCat.map((e, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: 'var(--text)' }}>{e.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* Budgets */}
        {budgets.length > 0 && (
          <div className="glass-card px-4 py-3">
            <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>{t('finance.budgets')}</p>
            <div className="flex flex-col gap-2">
              {budgets.map(b => {
                const pct = Math.min(100, b.limit_amount > 0 ? (b.spent / b.limit_amount) * 100 : 0);
                return (
                  <div key={b.id}>
                    <div className="flex justify-between text-sm mb-0.5">
                      <span>{b.category_icon} {b.category_name}</span>
                      <span style={{ color: pct > 90 ? 'var(--danger)' : 'var(--text)' }}>
                        {Math.round(b.spent)} / {b.limit_amount}
                      </span>
                    </div>
                    <div className="rounded-full overflow-hidden" style={{ height: 6, background: isLight ? 'rgba(68,95,132,0.14)' : 'var(--glass)' }}>
                      <div
                        className="rounded-full"
                        style={{
                          width: `${pct}%`, height: '100%',
                          background: pct > 90 ? 'var(--danger)' : b.category_color,
                          transition: 'width 0.4s',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Goals */}
        {goals.length > 0 && (
          <GoalsSection goals={goals} onDeposit={async (id, amount) => {
            await ipc.finance.goals.addTo(id, amount);
            reload();
          }} />
        )}

        {/* Recent transactions */}
        <div className="glass-card px-4 py-3">
          <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>{t('finance.transactions')}</p>
          {transactions.length === 0 ? (
            <p style={{ color: 'var(--text-sec)', fontSize: 13 }}>{t('finance.no_txs')}</p>
          ) : (
            <div className="flex flex-col gap-1">
              {transactions.slice(0, 20).map(tx => (
                <div key={tx.id} className="flex items-center gap-3" style={{ minHeight: 46, borderBottom: '1px solid var(--separator)', paddingLeft: 2, paddingRight: 2 }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>
                    {tx.type === 'transfer' ? '⇄' : tx.category_icon || '●'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
                      {tx.type === 'transfer'
                        ? `${tx.account_name || '?'} → ${tx.to_account_name || '?'}`
                        : tx.title || tx.category_name || '—'}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-done)' }}>{tx.date}</p>
                  </div>
                  <p
                    className="text-sm font-bold flex-shrink-0"
                    style={{
                      color: tx.type === 'income' ? 'var(--success)'
                        : tx.type === 'transfer' ? 'var(--accent)'
                        : 'var(--danger)',
                    }}
                  >
                    {tx.type === 'income' ? '+' : tx.type === 'transfer' ? '⇄' : '−'}{tx.amount.toLocaleString()} {tx.currency}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GoalsSection({ goals, onDeposit }: { goals: Goal[]; onDeposit: (id: number, amount: number) => void }) {
  const { t } = useTranslation();
  const [depositId, setDepositId] = React.useState<number | null>(null);
  const [amount, setAmount] = React.useState('');

  function submit(g: Goal) {
    const n = parseFloat(amount);
    if (!n || n <= 0) return;
    onDeposit(g.id, n);
    setDepositId(null);
    setAmount('');
  }

  return (
    <div className="glass-card px-4 py-3">
      <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>{t('finance.goals')}</p>
      <div className="grid grid-cols-2 gap-3">
        {goals.map(g => {
          const pct = Math.min(100, g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0);
          const done = g.current_amount >= g.target_amount;
          const isOpen = depositId === g.id;
          return (
            <div key={g.id} className="rounded-lg px-3 py-2" style={{ background: 'var(--glass)', border: `1px solid ${isOpen ? g.color : 'var(--glass-border)'}`, transition: 'border-color 0.2s' }}>
              <div className="flex items-center justify-between mb-0.5">
                <p className="text-sm font-semibold truncate">{g.name}</p>
                {done
                  ? <span style={{ fontSize: 14 }}>✅</span>
                  : <button
                      onClick={() => { setDepositId(isOpen ? null : g.id); setAmount(''); }}
                      style={{
                        background: isOpen ? 'var(--glass-hover)' : 'transparent',
                        border: `1px solid ${g.color}`,
                        borderRadius: 6, padding: '1px 8px', cursor: 'pointer',
                        color: g.color, fontSize: 11, fontWeight: 600, flexShrink: 0,
                      }}
                    >{t('finance.deposit')}</button>
                }
              </div>
              <p className="text-xs" style={{ color: 'var(--text-sec)' }}>
                {Math.round(g.current_amount).toLocaleString()} / {g.target_amount.toLocaleString()} {g.currency}
              </p>
              <div className="rounded-full overflow-hidden mt-1.5" style={{ height: 6, background: 'var(--separator)' }}>
                <div className="rounded-full" style={{ width: `${pct}%`, height: '100%', background: g.color, transition: 'width 0.4s' }} />
              </div>
              {isOpen && (
                <div className="flex gap-1.5 mt-2">
                  <input
                    autoFocus
                    type="number" min="1" placeholder={t('finance.amount')}
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') submit(g); if (e.key === 'Escape') setDepositId(null); }}
                    className="flex-1 rounded px-2 py-1 text-sm outline-none"
                    style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'var(--text)', minWidth: 0 }}
                  />
                  <button
                    onClick={() => submit(g)}
                    style={{ background: g.color, border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', color: '#fff', fontSize: 13, fontWeight: 600 }}
                  >✓</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FinKpiCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="glass-card px-4 py-3">
      <p style={{ color: 'var(--text-sec)', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      <p style={{ color, fontSize: 22, fontWeight: 700 }}>{value}</p>
    </div>
  );
}
