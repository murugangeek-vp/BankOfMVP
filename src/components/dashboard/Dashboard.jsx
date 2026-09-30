import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../App';
import { fetchAccounts, fetchTransactions, fetchLoans, fetchCorporateRequests } from '../../services/api';
import {
  TrendingUp, TrendingDown, DollarSign, PiggyBank, Wallet,
  Building2, ArrowUpRight, ArrowDownRight, CreditCard, Landmark,
  Activity, Clock
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';

const cashFlowData = [
  { month: 'Apr', income: 92000, expenses: 67000 },
  { month: 'May', income: 95000, expenses: 71000 },
  { month: 'Jun', income: 89000, expenses: 63000 },
  { month: 'Jul', income: 101000, expenses: 78000 },
  { month: 'Aug', income: 95000, expenses: 69000 },
  { month: 'Sep', income: 98000, expenses: 72000 },
];

export default function Dashboard() {
  const { currentRole, role } = useAppContext();
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const userId = currentRole === 'CORPORATE_MAKER' || currentRole === 'CORPORATE_CHECKER' ? 2 : currentRole === 'BANK_MANAGER' ? undefined : 1;
        const accs = await fetchAccounts(userId || 1);
        setAccounts(accs);

        if (accs.length > 0) {
          const txs = await fetchTransactions(accs[0].id);
          setTransactions(txs);
        }

        const lns = await fetchLoans(userId);
        setLoans(lns);
      } catch (err) {
        console.warn('API unavailable, using default state');
      }
      setLoading(false);
    }
    load();
  }, [currentRole]);

  const totalBalance = accounts.reduce((sum, a) => sum + parseFloat(a.balance || 0), 0);
  const totalOverdraft = accounts.reduce((sum, a) => sum + parseFloat(a.overdraft_limit || 0), 0);
  const totalInterest = accounts.reduce((sum, a) => sum + parseFloat(a.accrued_interest || 0), 0);

  const accountIcons = { SAVINGS: PiggyBank, CURRENT: Wallet, CORPORATE_SAVINGS: Building2 };
  const accountColors = { SAVINGS: '#10B981', CURRENT: '#3B82F6', CORPORATE_SAVINGS: '#F59E0B' };

  const formatCurrency = (val) => `$${parseFloat(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-28 rounded-2xl"></div>)}
        </div>
        <div className="skeleton h-72 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Welcome back, {role.name.split(' ')[0]}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Here's your financial overview for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'var(--color-emerald-glow)', color: 'var(--color-emerald)' }}>
          <Activity size={16} />
          <span className="text-sm font-semibold">System Online</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Worth */}
        <div className="glass-card p-5 animate-fadeIn stagger-1">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-blue-glow)' }}>
              <DollarSign size={20} style={{ color: 'var(--color-blue)' }} />
            </div>
            <span className="badge badge-success"><ArrowUpRight size={12} /> +2.4%</span>
          </div>
          <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Total Balance</p>
          <p className="text-xl font-bold font-display mt-1">{formatCurrency(totalBalance)}</p>
        </div>

        {/* Interest Earned */}
        <div className="glass-card p-5 animate-fadeIn stagger-2">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-emerald-glow)' }}>
              <TrendingUp size={20} style={{ color: 'var(--color-emerald)' }} />
            </div>
            <span className="badge badge-success"><TrendingUp size={12} /> Accrued</span>
          </div>
          <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Interest Earned</p>
          <p className="text-xl font-bold font-display mt-1">{formatCurrency(totalInterest)}</p>
        </div>

        {/* Credit Available */}
        <div className="glass-card p-5 animate-fadeIn stagger-3">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-purple-glow)' }}>
              <CreditCard size={20} style={{ color: 'var(--color-purple)' }} />
            </div>
          </div>
          <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Overdraft Available</p>
          <p className="text-xl font-bold font-display mt-1">{formatCurrency(totalOverdraft)}</p>
        </div>

        {/* Active Loans */}
        <div className="glass-card p-5 animate-fadeIn stagger-4">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-gold-glow)' }}>
              <Landmark size={20} style={{ color: 'var(--color-gold)' }} />
            </div>
          </div>
          <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Active Loans</p>
          <p className="text-xl font-bold font-display mt-1">{loans.filter(l => l.status === 'ACTIVE').length}</p>
        </div>
      </div>

      {/* Charts & Accounts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Flow Chart */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold font-display">Cash Flow Overview</h3>
            <span className="text-xs px-3 py-1 rounded-lg" style={{ background: 'var(--color-bg-elevated)', color: 'var(--color-text-muted)' }}>Last 6 Months</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={cashFlowData}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
              <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#1A2D4A', border: '1px solid rgba(148,163,184,0.15)', borderRadius: 12, fontSize: 12, color: '#F1F5F9' }}
                formatter={(v) => [`$${v.toLocaleString()}`, '']}
              />
              <Area type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} fill="url(#incomeGrad)" name="Income" />
              <Area type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} fill="url(#expenseGrad)" name="Expenses" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Account Cards */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold font-display">Your Accounts</h3>
          {accounts.map((acc, idx) => {
            const Icon = accountIcons[acc.account_type] || Wallet;
            const color = accountColors[acc.account_type] || '#3B82F6';

            return (
              <div key={acc.id} className={`glass-card p-4 animate-fadeIn stagger-${idx + 1}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}20`, color }}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>{acc.account_type.replace('_', ' ')}</p>
                    <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{acc.account_number}</p>
                  </div>
                </div>
                <p className="text-lg font-bold font-display">{formatCurrency(acc.balance)}</p>
                {parseFloat(acc.accrued_interest) > 0 && (
                  <p className="text-xs mt-1" style={{ color: 'var(--color-emerald)' }}>
                    +{formatCurrency(acc.accrued_interest)} interest accrued
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h3 className="text-base font-semibold font-display">Recent Transactions</h3>
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{transactions.length} entries</span>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Type</th>
                <th>Description</th>
                <th>Counterparty</th>
                <th>Amount</th>
                <th>Balance After</th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice(0, 8).map((tx, idx) => {
                const isCredit = ['DEPOSIT', 'TRANSFER_IN', 'INTEREST_CREDIT'].includes(tx.tx_type);
                return (
                  <tr key={tx.id || idx}>
                    <td className="font-mono text-xs">{tx.tx_ref}</td>
                    <td>
                      <span className={`badge ${isCredit ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.65rem' }}>
                        {isCredit ? <ArrowDownRight size={10} /> : <ArrowUpRight size={10} />}
                        {tx.tx_type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>{tx.description}</td>
                    <td style={{ color: 'var(--color-text-muted)' }}>{tx.counterparty_name}</td>
                    <td className={`amount ${isCredit ? 'positive' : 'negative'}`}>
                      {isCredit ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                    <td className="amount">{formatCurrency(tx.balance_after)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
