import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../App';
import { fetchLoans, fetchAmortization, applyForLoan, approveLoan, fetchMasterData } from '../../services/api';
import {
  Landmark, FileText, CheckCircle2, Clock, AlertTriangle, XCircle,
  Plus, ChevronRight, Calculator, DollarSign, Calendar, TrendingUp, CreditCard
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

const STEPS = ['Product', 'Details', 'Review'];

export default function LoanManagementModule() {
  const { currentRole } = useAppContext();
  const [loans, setLoans] = useState([]);
  const [loanProducts, setLoanProducts] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [amortization, setAmortization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showApplyWizard, setShowApplyWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [applicationResult, setApplicationResult] = useState(null);

  const [applyForm, setApplyForm] = useState({
    productKey: 'PERSONAL_LOAN',
    requestedAmount: '',
    tenureMonths: 24,
    monthlyIncome: 95000,
    creditScore: 765,
  });

  const isManager = currentRole === 'BANK_MANAGER';

  useEffect(() => { loadData(); }, [currentRole]);

  async function loadData() {
    setLoading(true);
    try {
      const userId = currentRole === 'BANK_MANAGER' ? undefined : 1;
      const lns = await fetchLoans(userId);
      setLoans(lns);

      const master = await fetchMasterData();
      setLoanProducts(master.loanProducts || []);
    } catch (err) { console.warn('API error', err); }
    setLoading(false);
  }

  async function viewAmortization(loan) {
    setSelectedLoan(loan);
    try {
      const data = await fetchAmortization(loan.id);
      setAmortization(data);
    } catch (err) { console.warn(err); }
  }

  async function handleApplyLoan() {
    try {
      const result = await applyForLoan({
        userId: 1,
        productKey: applyForm.productKey,
        requestedAmount: applyForm.requestedAmount,
        tenureMonths: applyForm.tenureMonths,
        monthlyIncome: applyForm.monthlyIncome,
        creditScore: applyForm.creditScore,
      });
      setApplicationResult(result);
      setShowApplyWizard(false);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Loan application failed');
    }
  }

  async function handleApproveLoan(loanId) {
    try {
      await approveLoan(loanId, 4);
      loadData();
    } catch (err) { alert('Failed to approve loan'); }
  }

  const formatCurrency = (val) => `$${parseFloat(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const statusConfig = {
    PENDING: { badge: 'badge-warning', icon: Clock },
    APPROVED: { badge: 'badge-info', icon: CheckCircle2 },
    ACTIVE: { badge: 'badge-success', icon: TrendingUp },
    CLOSED: { badge: 'badge-purple', icon: FileText },
    DEFAULTED: { badge: 'badge-danger', icon: AlertTriangle },
    REJECTED: { badge: 'badge-danger', icon: XCircle },
  };

  const selectedProduct = loanProducts.find(p => p.product_key === applyForm.productKey) || loanProducts[0];

  if (loading) {
    return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="skeleton h-28 rounded-2xl"></div>)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display flex items-center gap-3">
            <Landmark size={28} style={{ color: 'var(--color-gold)' }} />
            Loan Management Hub
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {isManager ? 'Bank Manager — Approve & manage all loan applications' : 'Apply for loans, track EMI payments, and view amortization schedules'}
          </p>
        </div>
        {!isManager && (
          <button className="btn-primary" onClick={() => { setShowApplyWizard(true); setWizardStep(0); setApplicationResult(null); }}>
            <Plus size={16} /> Apply for Loan
          </button>
        )}
      </div>

      {/* Application Result */}
      {applicationResult && (
        <div className="glass-card p-6 animate-scaleIn" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 size={24} style={{ color: 'var(--color-emerald)' }} />
            <h3 className="text-lg font-semibold font-display">Loan Application Processed</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Loan Number</p>
              <p className="text-sm font-bold font-mono">{applicationResult.loan?.loan_number}</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Credit Tier</p>
              <p className="text-sm font-bold" style={{ color: 'var(--color-emerald)' }}>{applicationResult.creditEvaluation?.tier}</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>APR</p>
              <p className="text-sm font-bold">{applicationResult.creditEvaluation?.apr}%</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Monthly EMI</p>
              <p className="text-sm font-bold" style={{ color: 'var(--color-blue)' }}>{formatCurrency(applicationResult.creditEvaluation?.emi)}</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Status</p>
              <span className={`badge ${statusConfig[applicationResult.loan?.status]?.badge || 'badge-info'}`}>
                {applicationResult.loan?.status}
              </span>
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Auto Approved</p>
              <p className="text-sm font-bold">{applicationResult.creditEvaluation?.autoApproved ? '✓ Yes' : '✗ No — Pending Manager'}</p>
            </div>
          </div>
          <button onClick={() => setApplicationResult(null)} className="text-xs mt-4 underline" style={{ color: 'var(--color-text-muted)' }}>Dismiss</button>
        </div>
      )}

      {/* Loans Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h3 className="text-base font-semibold font-display">{isManager ? 'All Loan Applications' : 'Your Loans'}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Loan #</th>
                <th>Product</th>
                <th>Amount</th>
                <th>APR</th>
                <th>EMI</th>
                <th>Tenure</th>
                <th>Credit Tier</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan, idx) => {
                const sc = statusConfig[loan.status] || statusConfig.PENDING;
                return (
                  <tr key={loan.id || idx}>
                    <td className="font-mono text-xs">{loan.loan_number}</td>
                    <td>{loan.product_key?.replace(/_/g, ' ')}</td>
                    <td className="amount">{formatCurrency(loan.requested_amount)}</td>
                    <td>{loan.apr_pct}%</td>
                    <td className="amount">{formatCurrency(loan.emi_amount)}</td>
                    <td>{loan.tenure_months} mo</td>
                    <td><span className="badge badge-info" style={{ fontSize: '0.6rem' }}>{loan.credit_tier}</span></td>
                    <td><span className={`badge ${sc.badge}`} style={{ fontSize: '0.6rem' }}>{loan.status}</span></td>
                    <td>
                      <div className="flex gap-2">
                        <button onClick={() => viewAmortization(loan)} className="btn-ghost py-1 px-2" style={{ fontSize: '0.7rem' }}>
                          <Calendar size={14} /> Schedule
                        </button>
                        {isManager && (loan.status === 'PENDING' || loan.status === 'APPROVED') && (
                          <button onClick={() => handleApproveLoan(loan.id)} className="btn-emerald py-1 px-2" style={{ fontSize: '0.7rem' }}>
                            <CheckCircle2 size={14} /> Activate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Amortization Schedule Detail */}
      {selectedLoan && amortization && (
        <div className="glass-card overflow-hidden animate-fadeIn">
          <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <h3 className="text-base font-semibold font-display">
              Amortization Schedule — {selectedLoan.loan_number}
            </h3>
            <button onClick={() => { setSelectedLoan(null); setAmortization(null); }} className="btn-ghost py-1 px-3" style={{ fontSize: '0.75rem' }}>Close</button>
          </div>

          {/* Chart */}
          <div className="p-5">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={(amortization.schedule || []).slice(0, 12)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                <XAxis dataKey="installment_num" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: 'Installment', position: 'insideBottom', offset: -3, fill: '#64748B', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: '#1A2D4A', border: '1px solid rgba(148,163,184,0.15)', borderRadius: 12, fontSize: 12, color: '#F1F5F9' }} formatter={v => formatCurrency(v)} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#94A3B8' }} />
                <Bar dataKey="principal_portion" name="Principal" fill="#3B82F6" radius={[4,4,0,0]} />
                <Bar dataKey="interest_portion" name="Interest" fill="#F59E0B" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto max-h-64">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Due Date</th>
                  <th>EMI</th>
                  <th>Principal</th>
                  <th>Interest</th>
                  <th>Remaining</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(amortization.schedule || []).map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.installment_num}</td>
                    <td>{item.due_date}</td>
                    <td className="amount">{formatCurrency(item.emi_amount)}</td>
                    <td className="amount">{formatCurrency(item.principal_portion)}</td>
                    <td className="amount" style={{ color: 'var(--color-gold)' }}>{formatCurrency(item.interest_portion)}</td>
                    <td className="amount">{formatCurrency(item.remaining_balance)}</td>
                    <td>
                      <span className={`badge ${item.status === 'PAID' ? 'badge-success' : item.status === 'OVERDUE' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '0.6rem' }}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Apply Wizard Modal */}
      {showApplyWizard && (
        <div className="modal-overlay" onClick={() => setShowApplyWizard(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ minWidth: '520px' }}>
            <h3 className="text-lg font-semibold font-display mb-2">Apply for a Loan</h3>

            {/* Step Indicator */}
            <div className="flex items-center gap-2 mb-6">
              {STEPS.map((step, idx) => (
                <React.Fragment key={idx}>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${wizardStep === idx ? 'text-white' : ''}`}
                    style={{ background: wizardStep === idx ? 'var(--color-blue)' : wizardStep > idx ? 'var(--color-emerald-glow)' : 'var(--color-bg-secondary)', color: wizardStep > idx ? 'var(--color-emerald)' : wizardStep === idx ? 'white' : 'var(--color-text-muted)' }}>
                    {wizardStep > idx ? <CheckCircle2 size={14} /> : <span>{idx + 1}</span>}
                    {step}
                  </div>
                  {idx < STEPS.length - 1 && <ChevronRight size={14} style={{ color: 'var(--color-text-muted)' }} />}
                </React.Fragment>
              ))}
            </div>

            {/* Step 0: Product Selection */}
            {wizardStep === 0 && (
              <div className="space-y-3">
                {loanProducts.map(prod => (
                  <button key={prod.product_key} onClick={() => setApplyForm({ ...applyForm, productKey: prod.product_key })}
                    className={`w-full p-4 rounded-xl text-left transition-all ${applyForm.productKey === prod.product_key ? 'ring-2 ring-blue-500' : ''}`}
                    style={{ background: 'var(--color-bg-secondary)', border: `1px solid ${applyForm.productKey === prod.product_key ? 'var(--color-blue)' : 'var(--color-border)'}` }}>
                    <p className="text-sm font-semibold">{prod.product_name}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                      {formatCurrency(prod.min_amount)} – {formatCurrency(prod.max_amount)} · Up to {prod.max_tenure_months} months · {prod.default_apr_pct}% base APR
                    </p>
                  </button>
                ))}
                <button onClick={() => setWizardStep(1)} className="btn-primary w-full mt-3">
                  Continue <ChevronRight size={16} />
                </button>
              </div>
            )}

            {/* Step 1: Details */}
            {wizardStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Loan Amount ($)</label>
                  <input className="input-field" type="number" min={selectedProduct?.min_amount || 1000} max={selectedProduct?.max_amount || 1000000} required value={applyForm.requestedAmount} onChange={e => setApplyForm({ ...applyForm, requestedAmount: e.target.value })} placeholder={`${formatCurrency(selectedProduct?.min_amount)} – ${formatCurrency(selectedProduct?.max_amount)}`} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Tenure (Months)</label>
                  <input className="input-field" type="number" min="6" max={selectedProduct?.max_tenure_months || 60} value={applyForm.tenureMonths} onChange={e => setApplyForm({ ...applyForm, tenureMonths: parseInt(e.target.value) })} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Monthly Income ($)</label>
                  <input className="input-field" type="number" value={applyForm.monthlyIncome} onChange={e => setApplyForm({ ...applyForm, monthlyIncome: parseFloat(e.target.value) })} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Credit Score</label>
                  <input className="input-field" type="number" min="300" max="850" value={applyForm.creditScore} onChange={e => setApplyForm({ ...applyForm, creditScore: parseInt(e.target.value) })} />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setWizardStep(0)} className="btn-ghost">Back</button>
                  <button onClick={() => setWizardStep(2)} className="btn-primary flex-1" disabled={!applyForm.requestedAmount}>
                    Review <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Review & Submit */}
            {wizardStep === 2 && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl space-y-2" style={{ background: 'var(--color-bg-secondary)' }}>
                  <div className="flex justify-between"><span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Product</span><span className="text-sm font-medium">{selectedProduct?.product_name}</span></div>
                  <div className="flex justify-between"><span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Amount</span><span className="text-sm font-bold">{formatCurrency(applyForm.requestedAmount)}</span></div>
                  <div className="flex justify-between"><span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Tenure</span><span className="text-sm">{applyForm.tenureMonths} months</span></div>
                  <div className="flex justify-between"><span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Base APR</span><span className="text-sm">{selectedProduct?.default_apr_pct}%</span></div>
                  <div className="flex justify-between"><span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Credit Score</span><span className="text-sm">{applyForm.creditScore}</span></div>
                  <div className="flex justify-between"><span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Monthly Income</span><span className="text-sm">{formatCurrency(applyForm.monthlyIncome)}</span></div>
                </div>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Your application will be evaluated against master credit scoring rules. Final APR and approval status will be determined automatically.
                </p>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setWizardStep(1)} className="btn-ghost">Back</button>
                  <button onClick={handleApplyLoan} className="btn-emerald flex-1">
                    <Calculator size={16} /> Submit Application
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
