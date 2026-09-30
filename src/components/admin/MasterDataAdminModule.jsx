import React, { useState, useEffect } from 'react';
import { fetchMasterData, updateInterestRate, updateFeePenalty } from '../../services/api';
import {
  Settings2, Percent, AlertCircle, ShieldAlert, Sparkles, Save, RotateCcw,
  Sliders, CheckCircle, HelpCircle, Layers, DollarSign, Calculator
} from 'lucide-react';

export default function MasterDataAdminModule() {
  const [masterData, setMasterData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingInterest, setEditingInterest] = useState({});
  const [editingPenalty, setEditingPenalty] = useState({});
  const [saveStatus, setSaveStatus] = useState(null);

  // Simulation State
  const [simBalance, setSimBalance] = useState(5000);
  const [simProduct, setSimProduct] = useState('RETAIL_SAVINGS');
  const [simIncome, setSimIncome] = useState(75000);
  const [simLoanAmount, setSimLoanAmount] = useState(25000);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchMasterData();
      if (res.success) {
        setMasterData(res.data);
      }
    } catch (err) {
      console.error("Error loading master data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInterestRateChange = (key, field, val) => {
    setEditingInterest(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || masterData.interestRates.find(r => r.product_key === key)),
        [field]: Number(val)
      }
    }));
  };

  const handleSaveInterest = async (key) => {
    const updated = editingInterest[key];
    if (!updated) return;
    try {
      setSaveStatus({ key, type: 'saving' });
      await updateInterestRate(key, updated);
      setSaveStatus({ key, type: 'success', message: 'Interest rate configuration saved successfully!' });
      setTimeout(() => setSaveStatus(null), 3000);
      loadData();
    } catch (err) {
      setSaveStatus({ key, type: 'error', message: 'Failed to update interest rate.' });
    }
  };

  const handlePenaltyChange = (accType, field, val) => {
    setEditingPenalty(prev => ({
      ...prev,
      [accType]: {
        ...(prev[accType] || masterData.feePenalties.find(p => p.account_type === accType)),
        [field]: Number(val)
      }
    }));
  };

  const handleSavePenalty = async (accType) => {
    const updated = editingPenalty[accType];
    if (!updated) return;
    try {
      setSaveStatus({ key: accType, type: 'saving' });
      await updateFeePenalty(accType, updated);
      setSaveStatus({ key: accType, type: 'success', message: 'Fee & penalty rules saved successfully!' });
      setTimeout(() => setSaveStatus(null), 3000);
      loadData();
    } catch (err) {
      setSaveStatus({ key: accType, type: 'error', message: 'Failed to update fee penalty.' });
    }
  };

  if (loading || !masterData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-3 text-emerald-400">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="font-mono text-sm">Loading System Master Data Engine...</span>
        </div>
      </div>
    );
  }

  // Simulation calculations based on current loaded master data
  const selectedInterest = masterData.interestRates.find(r => r.product_key === simProduct) || masterData.interestRates[0];
  const effectiveRate = simBalance >= Number(selectedInterest?.min_balance || 0)
    ? Number(selectedInterest?.annual_rate_pct) + Number(selectedInterest?.bonus_rate_pct || 0)
    : Number(selectedInterest?.annual_rate_pct);
  const estimatedAnnualYield = (simBalance * effectiveRate) / 100;
  const estimatedMonthlyYield = estimatedAnnualYield / 12;

  // Credit Score Simulation
  let simCreditTier = 'Standard';
  let simMaxLoan = simIncome * 0.4;
  let simAutoApprove = false;

  if (masterData.creditScoringRules) {
    const matched = masterData.creditScoringRules.find(r => simIncome >= Number(r.min_monthly_income || 0) * 12);
    if (matched) {
      simCreditTier = matched.tier_name || matched.score_tier;
      simMaxLoan = Number(matched.max_loan_multiplier) * simIncome;
      simAutoApprove = Boolean(matched.auto_approval_eligible);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Settings2 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Master Data Admin Console</h1>
                <p className="text-slate-400 text-sm">
                  Configure core business logic rules, interest parameters, penalty triggers, and credit decision scoring tiers.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={loadData}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 rounded-xl transition text-sm font-medium"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reload Config</span>
          </button>
        </div>
      </div>

      {saveStatus && (
        <div className={`p-4 rounded-xl border flex items-center space-x-3 text-sm ${
          saveStatus.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : saveStatus.type === 'error'
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
        }`}>
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{saveStatus.message || 'Saving changes to database...'}</span>
        </div>
      )}

      {/* Grid: 2 Columns (Tables & Rule Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left 2 Columns: Config Tables */}
        <div className="lg:col-span-2 space-y-6">

          {/* 1. Master Interest Rates Config */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Percent className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">Dynamic Master Interest Rates</h3>
              </div>
              <span className="badge badge-success">PostgreSQL Master DB</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/60 text-slate-400 text-xs uppercase border-b border-slate-800 font-mono">
                  <tr>
                    <th className="py-3 px-4">Product Key</th>
                    <th className="py-3 px-4">Annual Rate (%)</th>
                    <th className="py-3 px-4">Min Bal ($)</th>
                    <th className="py-3 px-4">Bonus (%)</th>
                    <th className="py-3 px-4">Compounding</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {masterData.interestRates.map((rate) => {
                    const edited = editingInterest[rate.product_key] || rate;
                    const isDirty = editingInterest[rate.product_key] !== undefined;

                    return (
                      <tr key={rate.product_key} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-4 font-semibold text-white font-mono">{rate.product_key}</td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            step="0.05"
                            value={edited.annual_rate_pct}
                            onChange={(e) => handleInterestRateChange(rate.product_key, 'annual_rate_pct', e.target.value)}
                            className="w-20 bg-slate-900 border border-slate-700/70 rounded-lg px-2 py-1 text-emerald-400 font-mono text-sm focus:outline-none focus:border-emerald-500"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            value={edited.min_balance}
                            onChange={(e) => handleInterestRateChange(rate.product_key, 'min_balance', e.target.value)}
                            className="w-24 bg-slate-900 border border-slate-700/70 rounded-lg px-2 py-1 text-slate-200 font-mono text-sm focus:outline-none focus:border-emerald-500"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            step="0.05"
                            value={edited.bonus_rate_pct || 0}
                            onChange={(e) => handleInterestRateChange(rate.product_key, 'bonus_rate_pct', e.target.value)}
                            className="w-20 bg-slate-900 border border-slate-700/70 rounded-lg px-2 py-1 text-blue-400 font-mono text-sm focus:outline-none focus:border-emerald-500"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 rounded-md bg-slate-800 text-slate-300 font-mono text-xs">
                            {rate.compounding_freq || 'DAILY'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            disabled={!isDirty}
                            onClick={() => handleSaveInterest(rate.product_key)}
                            className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                              isDirty
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Save</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. Fee & Penalty Rules Config */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white">Fee Penalty & Minimum Balance Rules</h3>
              </div>
              <span className="badge badge-warning">Enforced Rules</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/60 text-slate-400 text-xs uppercase border-b border-slate-800 font-mono">
                  <tr>
                    <th className="py-3 px-4">Account Type</th>
                    <th className="py-3 px-4">Min Monthly Bal ($)</th>
                    <th className="py-3 px-4">Penalty Fee ($)</th>
                    <th className="py-3 px-4">Overdraft APR (%)</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {masterData.feePenalties.map((pen) => {
                    const edited = editingPenalty[pen.account_type] || pen;
                    const isDirty = editingPenalty[pen.account_type] !== undefined;

                    return (
                      <tr key={pen.account_type} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-4 font-semibold text-white font-mono">{pen.account_type}</td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            value={edited.min_monthly_balance}
                            onChange={(e) => handlePenaltyChange(pen.account_type, 'min_monthly_balance', e.target.value)}
                            className="w-24 bg-slate-900 border border-slate-700/70 rounded-lg px-2 py-1 text-slate-200 font-mono text-sm focus:outline-none focus:border-amber-500"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            value={edited.penalty_fee}
                            onChange={(e) => handlePenaltyChange(pen.account_type, 'penalty_fee', e.target.value)}
                            className="w-20 bg-slate-900 border border-slate-700/70 rounded-lg px-2 py-1 text-rose-400 font-mono text-sm focus:outline-none focus:border-amber-500"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            step="0.5"
                            value={edited.overdraft_interest_rate_pct || 0}
                            onChange={(e) => handlePenaltyChange(pen.account_type, 'overdraft_interest_rate_pct', e.target.value)}
                            className="w-20 bg-slate-900 border border-slate-700/70 rounded-lg px-2 py-1 text-amber-400 font-mono text-sm focus:outline-none focus:border-amber-500"
                          />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            disabled={!isDirty}
                            onClick={() => handleSavePenalty(pen.account_type)}
                            className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                              isDirty
                                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/30'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Save</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Credit Scoring Master Rules */}
          {masterData.creditScoringRules && (
            <div className="glass-card rounded-2xl p-6 border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Sliders className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-bold text-white">Credit Scoring Tiers & Risk Engine</h3>
                </div>
                <span className="badge badge-info font-mono">Automated Decision Matrix</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-800/60 text-slate-400 text-xs uppercase border-b border-slate-800 font-mono">
                    <tr>
                      <th className="py-3 px-4">Tier Name</th>
                      <th className="py-3 px-4">Score Range</th>
                      <th className="py-3 px-4">Min Monthly Inc ($)</th>
                      <th className="py-3 px-4">Loan Multiplier</th>
                      <th className="py-3 px-4">Max DTI (%)</th>
                      <th className="py-3 px-4">Auto Approve</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                    {masterData.creditScoringRules.map((rule, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-4 font-semibold text-white">{rule.tier_name || rule.score_tier}</td>
                        <td className="py-3 px-4 text-emerald-400">{rule.min_credit_score} - {rule.max_credit_score}</td>
                        <td className="py-3 px-4">${Number(rule.min_monthly_income || 0).toLocaleString()}</td>
                        <td className="py-3 px-4 text-blue-400">{rule.max_loan_multiplier}x Annual</td>
                        <td className="py-3 px-4">{rule.max_dti_ratio_pct}%</td>
                        <td className="py-3 px-4">
                          {rule.auto_approval_eligible ? (
                            <span className="text-emerald-400 font-semibold">Yes</span>
                          ) : (
                            <span className="text-slate-500">Manual Review</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Right 1 Column: Real-Time Engine Simulator */}
        <div className="space-y-6">

          {/* Simulator Card */}
          <div className="glass-card rounded-2xl p-6 border border-emerald-500/30 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Live Calculation Simulator</h3>
                <p className="text-xs text-slate-400">Test master data rules against dynamic inputs</p>
              </div>
            </div>

            <div className="space-y-4 text-sm">
              {/* Product Selector */}
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Product Type</label>
                <select
                  value={simProduct}
                  onChange={(e) => setSimProduct(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700/80 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-emerald-500"
                >
                  {masterData.interestRates.map(r => (
                    <option key={r.product_key} value={r.product_key}>{r.product_key}</option>
                  ))}
                </select>
              </div>

              {/* Balance Slider */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-mono text-slate-400">Test Account Balance</label>
                  <span className="font-mono text-emerald-400 font-bold">${simBalance.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="100000"
                  step="500"
                  value={simBalance}
                  onChange={(e) => setSimBalance(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Result Preview Box */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Base Rate:</span>
                  <span className="text-slate-200 font-bold">{selectedInterest?.annual_rate_pct}%</span>
                </div>

                <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Min Balance Threshold:</span>
                  <span className="text-slate-200">${Number(selectedInterest?.min_balance || 0).toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Applied Rate (w/ Bonus):</span>
                  <span className="text-emerald-400 font-bold text-sm">{effectiveRate.toFixed(2)}% APR</span>
                </div>

                <div className="flex justify-between items-center pt-1 text-sm font-bold">
                  <span className="text-slate-300">Est. Monthly Interest:</span>
                  <span className="text-emerald-300">${estimatedMonthlyYield.toFixed(2)}</span>
                </div>
              </div>

              {/* Loan Engine Simulation */}
              <div className="pt-4 border-t border-slate-800">
                <div className="flex items-center space-x-2 text-xs font-mono text-slate-400 mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>Credit Engine Test</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1 text-xs">
                      <span className="text-slate-400">Annual Income</span>
                      <span className="font-mono text-blue-400">${simIncome.toLocaleString()}</span>
                    </div>
                    <input
                      type="range"
                      min="20000"
                      max="200000"
                      step="5000"
                      value={simIncome}
                      onChange={(e) => setSimIncome(Number(e.target.value))}
                      className="w-full accent-blue-500 cursor-pointer"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Scoring Tier:</span>
                      <span className="text-blue-300 font-bold">{simCreditTier}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Max Loan Limit:</span>
                      <span className="text-emerald-400 font-bold">${simMaxLoan.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Auto-Approval:</span>
                      <span className={simAutoApprove ? 'text-emerald-400' : 'text-amber-400'}>
                        {simAutoApprove ? 'Eligible' : 'Requires Manager Review'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Audit Rule Note Card */}
          <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-2 text-xs text-slate-400">
            <div className="flex items-center space-x-2 text-slate-200 font-bold">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Governance & Auditability</span>
            </div>
            <p>
              Every modification made in this Master Data Admin console triggers an immutable event log entry in the compliance ledger, recording the operator user ID, previous values, timestamp, and target table.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
