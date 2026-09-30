import React, { useState, useEffect } from 'react';
import { fetchAccounts, fetchTransactions, postTransaction, updateOverdraftLimit } from '../../services/api';
import {
  Wallet, ArrowUpRight, ArrowDownRight, CreditCard, Send, Plus,
  TrendingDown, AlertTriangle, Download, Building
} from 'lucide-react';

export default function CurrentAccountModule() {
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showOverdraftModal, setShowOverdraftModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: '', description: '', counterpartyName: '', type: 'VENDOR_PAYMENT' });
  const [newOverdraftLimit, setNewOverdraftLimit] = useState('');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const accs = await fetchAccounts(1);
      const current = accs.find(a => a.account_type === 'CURRENT');
      if (current) {
        setAccount(current);
        setNewOverdraftLimit(current.overdraft_limit);
        const txs = await fetchTransactions(current.id);
        setTransactions(txs);
      }
    } catch (err) { console.warn('API error', err); }
    setLoading(false);
  }

  async function handlePayment(e) {
    e.preventDefault();
    try {
      await postTransaction({
        accountId: account.id,
        type: paymentForm.type,
        amount: paymentForm.amount,
        category: 'VENDOR',
        description: paymentForm.description || 'Vendor Payment',
        counterpartyName: paymentForm.counterpartyName || 'Vendor',
      });
      setShowPaymentModal(false);
      setPaymentForm({ amount: '', description: '', counterpartyName: '', type: 'VENDOR_PAYMENT' });
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Transaction failed');
    }
  }

  async function handleOverdraftUpdate(e) {
    e.preventDefault();
    try {
      await updateOverdraftLimit(account.id, newOverdraftLimit);
      setShowOverdraftModal(false);
      loadData();
    } catch (err) { alert('Failed to update overdraft limit'); }
  }

  const formatCurrency = (val) => `$${parseFloat(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const balance = parseFloat(account?.balance || 0);
  const overdraftLimit = parseFloat(account?.overdraft_limit || 0);
  const availableFunds = balance + overdraftLimit;
  const overdraftUsed = balance < 0 ? Math.abs(balance) : 0;
  const overdraftPct = overdraftLimit > 0 ? (overdraftUsed / overdraftLimit) * 100 : 0;

  if (loading) {
    return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="skeleton h-32 rounded-2xl"></div>)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display flex items-center gap-3">
            <Wallet size={28} style={{ color: 'var(--color-blue)' }} />
            Current Account
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Account: {account?.account_number}</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-ghost" onClick={() => setShowOverdraftModal(true)}>
            <CreditCard size={16} /> Manage Overdraft
          </button>
          <button className="btn-primary" onClick={() => setShowPaymentModal(true)}>
            <Send size={16} /> Make Payment
          </button>
        </div>
      </div>

      {/* Balance & Overdraft Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5">
          <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Current Balance</p>
          <p className="text-2xl font-bold font-display mt-2">{formatCurrency(balance)}</p>
          <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>No withdrawal restrictions</p>
        </div>

        <div className="glass-card p-5">
          <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Available Funds (incl. Overdraft)</p>
          <p className="text-2xl font-bold font-display mt-2" style={{ color: 'var(--color-blue)' }}>{formatCurrency(availableFunds)}</p>
          <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>Overdraft limit: {formatCurrency(overdraftLimit)}</p>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Overdraft Usage</p>
            {overdraftUsed > 0 && <AlertTriangle size={16} style={{ color: 'var(--color-gold)' }} />}
          </div>
          <p className="text-2xl font-bold font-display mt-2" style={{ color: overdraftUsed > 0 ? 'var(--color-gold)' : 'var(--color-emerald)' }}>
            {overdraftUsed > 0 ? formatCurrency(overdraftUsed) : '$0.00'}
          </p>
          <div className="progress-bar mt-3">
            <div className="progress-fill" style={{
              width: `${Math.min(overdraftPct, 100)}%`,
              background: overdraftPct > 80 ? 'var(--color-danger)' : overdraftPct > 50 ? 'var(--color-gold)' : 'var(--color-emerald)'
            }}></div>
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{overdraftPct.toFixed(1)}% of {formatCurrency(overdraftLimit)} used</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Vendor Payment', icon: Building, onClick: () => setShowPaymentModal(true) },
          { label: 'Fund Transfer', icon: Send, onClick: () => { setPaymentForm({ ...paymentForm, type: 'TRANSFER_OUT' }); setShowPaymentModal(true); } },
          { label: 'Deposit Funds', icon: ArrowDownRight, onClick: () => { setPaymentForm({ ...paymentForm, type: 'DEPOSIT' }); setShowPaymentModal(true); } },
          { label: 'Tax Statement', icon: Download, onClick: () => alert('Tax statement export simulation — CSV generated.') },
        ].map((action, idx) => (
          <button key={idx} onClick={action.onClick} className="glass-card p-4 flex items-center gap-3 cursor-pointer hover:border-blue-500/30 transition-all text-left">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-blue-glow)', color: 'var(--color-blue)' }}>
              <action.icon size={18} />
            </div>
            <span className="text-sm font-medium">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Transactions */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h3 className="text-base font-semibold font-display">Transaction History</h3>
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{transactions.length} entries</span>
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
              {transactions.map((tx, idx) => {
                const isCredit = ['DEPOSIT', 'TRANSFER_IN'].includes(tx.tx_type);
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

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold font-display mb-5">
              {paymentForm.type === 'DEPOSIT' ? 'Deposit Funds' : paymentForm.type === 'TRANSFER_OUT' ? 'Fund Transfer' : 'Vendor Payment'}
            </h3>
            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Amount ($)</label>
                <input className="input-field" type="number" step="0.01" min="0.01" required placeholder="Enter amount" value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Description</label>
                <input className="input-field" placeholder="e.g. Equipment purchase" value={paymentForm.description} onChange={e => setPaymentForm({ ...paymentForm, description: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-text-muted)' }}>
                  {paymentForm.type === 'DEPOSIT' ? 'Source' : 'Recipient'}
                </label>
                <input className="input-field" placeholder="e.g. Office Supplies Inc" value={paymentForm.counterpartyName} onChange={e => setPaymentForm({ ...paymentForm, counterpartyName: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1"><Send size={16} /> Submit</button>
                <button type="button" className="btn-ghost" onClick={() => setShowPaymentModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Overdraft Modal */}
      {showOverdraftModal && (
        <div className="modal-overlay" onClick={() => setShowOverdraftModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold font-display mb-5 flex items-center gap-2">
              <CreditCard size={20} /> Manage Overdraft Limit
            </h3>
            <form onSubmit={handleOverdraftUpdate} className="space-y-4">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Current Limit: {formatCurrency(account?.overdraft_limit)}</label>
                <input className="input-field" type="number" step="1000" min="0" max="100000" required placeholder="New overdraft limit" value={newOverdraftLimit} onChange={e => setNewOverdraftLimit(e.target.value)} />
              </div>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Overdraft interest: 12.00% APR (charged monthly on utilized balance)
              </p>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">Update Limit</button>
                <button type="button" className="btn-ghost" onClick={() => setShowOverdraftModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
