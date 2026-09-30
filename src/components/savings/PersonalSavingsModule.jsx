import React, { useState, useEffect } from 'react';
import { fetchAccounts, fetchTransactions, postTransaction, calculateInterest } from '../../services/api';
import {
  PiggyBank, ArrowDownRight, ArrowUpRight, TrendingUp,
  Target, Plus, Send, Calculator, Filter, Download
} from 'lucide-react';

export default function PersonalSavingsModule() {
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTxModal, setShowTxModal] = useState(false);
  const [txForm, setTxForm] = useState({ type: 'DEPOSIT', amount: '', description: '', counterpartyName: '' });
  const [interestResult, setInterestResult] = useState(null);
  const [filterType, setFilterType] = useState('ALL');

  const savingsGoals = [
    { name: 'Emergency Fund', target: 50000, current: 24850.75, color: '#3B82F6' },
    { name: 'Vacation 2027', target: 8000, current: 3200, color: '#10B981' },
    { name: 'New Car', target: 35000, current: 12500, color: '#F59E0B' },
  ];

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const accs = await fetchAccounts(1);
      const savings = accs.find(a => a.account_type === 'SAVINGS');
      if (savings) {
        setAccount(savings);
        const txs = await fetchTransactions(savings.id);
        setTransactions(txs);
      }
    } catch (err) { console.warn('API error', err); }
    setLoading(false);
  }

  async function handleTransaction(e) {
    e.preventDefault();
    try {
      await postTransaction({
        accountId: account.id,
        type: txForm.type,
        amount: txForm.amount,
        category: txForm.type === 'DEPOSIT' ? 'SAVINGS' : 'WITHDRAWAL',
        description: txForm.description || `${txForm.type} transaction`,
        counterpartyName: txForm.counterpartyName || 'Self',
      });
      setShowTxModal(false);
      setTxForm({ type: 'DEPOSIT', amount: '', description: '', counterpartyName: '' });
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Transaction failed');
    }
  }

  async function handleCalculateInterest() {
    try {
      const result = await calculateInterest(account.id);
      setInterestResult(result);
      loadData();
    } catch (err) { console.error(err); }
  }

  const formatCurrency = (val) => `$${parseFloat(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const filteredTx = filterType === 'ALL' ? transactions : transactions.filter(t => t.tx_type === filterType);

  if (loading) {
    return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="skeleton h-32 rounded-2xl"></div>)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display flex items-center gap-3">
            <PiggyBank size={28} style={{ color: 'var(--color-emerald)' }} />
            Personal Savings
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Account: {account?.account_number}</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-emerald" onClick={handleCalculateInterest}>
            <Calculator size={16} /> Calculate Interest
          </button>
          <button className="btn-primary" onClick={() => setShowTxModal(true)}>
            <Plus size={16} /> New Transaction
          </button>
        </div>
      </div>

      {/* Interest Calculation Result */}
      {interestResult && (
        <div className="glass-card p-5 animate-scaleIn" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp size={20} style={{ color: 'var(--color-emerald)' }} />
            <h3 className="font-semibold text-sm">Interest Credited Successfully</h3>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-3">
            <div>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>APR</p>
              <p className="text-lg font-bold" style={{ color: 'var(--color-emerald)' }}>{interestResult.annualRatePct}%</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Interest Credited</p>
              <p className="text-lg font-bold" style={{ color: 'var(--color-emerald)' }}>{formatCurrency(interestResult.interestCredited)}</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>New Balance</p>
              <p className="text-lg font-bold">{formatCurrency(interestResult.newBalance)}</p>
            </div>
          </div>
          <button onClick={() => setInterestResult(null)} className="text-xs mt-3 underline" style={{ color: 'var(--color-text-muted)' }}>Dismiss</button>
        </div>
      )}

      {/* Balance & Interest Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5">
          <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Current Balance</p>
          <p className="text-2xl font-bold font-display mt-2">{formatCurrency(account?.balance)}</p>
          <div className="flex items-center gap-1 mt-2 text-xs" style={{ color: 'var(--color-emerald)' }}>
            <ArrowUpRight size={14} /> Active & Earning Interest
          </div>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Accrued Interest</p>
          <p className="text-2xl font-bold font-display mt-2" style={{ color: 'var(--color-emerald)' }}>{formatCurrency(account?.accrued_interest)}</p>
          <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>Daily compounding</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Min. Balance Required</p>
          <p className="text-2xl font-bold font-display mt-2">{formatCurrency(1000)}</p>
          <div className="flex items-center gap-1 mt-2 text-xs" style={{ color: parseFloat(account?.balance) >= 1000 ? 'var(--color-emerald)' : 'var(--color-danger)' }}>
            {parseFloat(account?.balance) >= 1000 ? '✓ Above minimum' : '✗ Below minimum — penalty applies'}
          </div>
        </div>
      </div>

      {/* Savings Goals */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold font-display flex items-center gap-2"><Target size={18} /> Savings Goals</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {savingsGoals.map((goal, idx) => (
            <div key={idx} className="p-4 rounded-xl" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">{goal.name}</p>
                <span className="text-xs font-bold" style={{ color: goal.color }}>{Math.round((goal.current / goal.target) * 100)}%</span>
              </div>
              <div className="progress-bar mb-2">
                <div className="progress-fill" style={{ width: `${(goal.current / goal.target) * 100}%`, background: goal.color }}></div>
              </div>
              <div className="flex justify-between text-xs" style={{ color: 'var(--color-text-muted)' }}>
                <span>{formatCurrency(goal.current)}</span>
                <span>of {formatCurrency(goal.target)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h3 className="text-base font-semibold font-display">Transaction History</h3>
          <div className="flex items-center gap-2">
            <Filter size={14} style={{ color: 'var(--color-text-muted)' }} />
            <select className="input-field" value={filterType} onChange={e => setFilterType(e.target.value)} style={{ width: 'auto', fontSize: '0.75rem', padding: '6px 32px 6px 10px' }}>
              <option value="ALL">All Types</option>
              <option value="DEPOSIT">Deposits</option>
              <option value="WITHDRAWAL">Withdrawals</option>
              <option value="TRANSFER_OUT">Transfers</option>
              <option value="INTEREST_CREDIT">Interest</option>
              <option value="PENALTY_FEE">Penalties</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto max-h-96">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ref</th>
                <th>Type</th>
                <th>Description</th>
                <th>Counterparty</th>
                <th>Amount</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {filteredTx.map((tx, idx) => {
                const isCredit = ['DEPOSIT', 'TRANSFER_IN', 'INTEREST_CREDIT'].includes(tx.tx_type);
                return (
                  <tr key={tx.id || idx}>
                    <td className="font-mono text-xs">{tx.tx_ref}</td>
                    <td><span className={`badge ${isCredit ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.6rem' }}>{tx.tx_type.replace(/_/g, ' ')}</span></td>
                    <td>{tx.description}</td>
                    <td style={{ color: 'var(--color-text-muted)' }}>{tx.counterparty_name}</td>
                    <td className={`amount ${isCredit ? 'positive' : 'negative'}`}>{isCredit ? '+' : '-'}{formatCurrency(tx.amount)}</td>
                    <td className="amount">{formatCurrency(tx.balance_after)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Modal */}
      {showTxModal && (
        <div className="modal-overlay" onClick={() => setShowTxModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold font-display mb-5">New Savings Transaction</h3>
            <form onSubmit={handleTransaction} className="space-y-4">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Transaction Type</label>
                <select className="input-field" value={txForm.type} onChange={e => setTxForm({ ...txForm, type: e.target.value })}>
                  <option value="DEPOSIT">Deposit</option>
                  <option value="WITHDRAWAL">Withdrawal</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Amount ($)</label>
                <input className="input-field" type="number" step="0.01" min="0.01" required placeholder="Enter amount" value={txForm.amount} onChange={e => setTxForm({ ...txForm, amount: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Description</label>
                <input className="input-field" placeholder="e.g. Payroll deposit" value={txForm.description} onChange={e => setTxForm({ ...txForm, description: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Counterparty</label>
                <input className="input-field" placeholder="e.g. Employer Inc." value={txForm.counterpartyName} onChange={e => setTxForm({ ...txForm, counterpartyName: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1"><Send size={16} /> Submit</button>
                <button type="button" className="btn-ghost" onClick={() => setShowTxModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
