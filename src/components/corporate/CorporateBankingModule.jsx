import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../App';
import { fetchCorporateRequests, submitCorporateRequest, submitCheckerDecision } from '../../services/api';
import {
  Building2, Shield, FileCheck, FileClock, FileX, Send,
  CheckCircle2, XCircle, Users, Clock, DollarSign, Plus, Eye
} from 'lucide-react';

export default function CorporateBankingModule() {
  const { currentRole } = useAppContext();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(null);
  const [reqForm, setReqForm] = useState({ requestType: 'HIGH_VALUE_TRANSFER', totalAmount: '', recipientCount: 1, payload: {} });
  const [rejectionReason, setRejectionReason] = useState('');

  const isMaker = currentRole === 'CORPORATE_MAKER';
  const isChecker = currentRole === 'CORPORATE_CHECKER';

  useEffect(() => { loadData(); }, [currentRole]);

  async function loadData() {
    setLoading(true);
    try {
      const data = await fetchCorporateRequests();
      setRequests(data);
    } catch (err) { console.warn('API error', err); }
    setLoading(false);
  }

  async function handleSubmitRequest(e) {
    e.preventDefault();
    try {
      await submitCorporateRequest({
        corporateAccountId: 3,
        makerUserId: 2,
        requestType: reqForm.requestType,
        totalAmount: reqForm.totalAmount,
        recipientCount: reqForm.recipientCount,
        payload: {
          recipientName: reqForm.recipientName || 'Corporate Recipient',
          purpose: reqForm.purpose || 'Corporate transfer',
          department: reqForm.department || 'Operations',
        },
      });
      setShowNewRequest(false);
      setReqForm({ requestType: 'HIGH_VALUE_TRANSFER', totalAmount: '', recipientCount: 1 });
      loadData();
    } catch (err) { alert('Failed to submit request'); }
  }

  async function handleDecision(requestId, action) {
    try {
      await submitCheckerDecision(requestId, {
        checkerUserId: 3,
        action,
        rejectionReason: action === 'REJECT' ? rejectionReason : null,
      });
      setShowDetailModal(null);
      setRejectionReason('');
      loadData();
    } catch (err) { alert(err.response?.data?.error || 'Decision failed'); }
  }

  const formatCurrency = (val) => `$${parseFloat(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const pending = requests.filter(r => r.status === 'PENDING');
  const approved = requests.filter(r => r.status === 'APPROVED');
  const rejected = requests.filter(r => r.status === 'REJECTED');

  const statusConfig = {
    PENDING: { badge: 'badge-warning', icon: FileClock, label: 'Pending Approval' },
    APPROVED: { badge: 'badge-success', icon: FileCheck, label: 'Approved' },
    REJECTED: { badge: 'badge-danger', icon: FileX, label: 'Rejected' },
  };

  if (loading) {
    return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="skeleton h-28 rounded-2xl"></div>)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display flex items-center gap-3">
            <Building2 size={28} style={{ color: 'var(--color-gold)' }} />
            Corporate Banking Portal
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {isMaker ? 'Maker View — Submit transfers & payroll for approval' : isChecker ? 'Checker View — Review and approve pending requests' : 'Bank Manager — Full oversight'}
          </p>
        </div>
        {isMaker && (
          <button className="btn-primary" onClick={() => setShowNewRequest(true)}>
            <Plus size={16} /> New Request
          </button>
        )}
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-gold-glow)' }}>
              <Clock size={20} style={{ color: 'var(--color-gold)' }} />
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Pending</p>
              <p className="text-xl font-bold">{pending.length}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-emerald-glow)' }}>
              <CheckCircle2 size={20} style={{ color: 'var(--color-emerald)' }} />
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Approved</p>
              <p className="text-xl font-bold">{approved.length}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-danger-glow)' }}>
              <XCircle size={20} style={{ color: 'var(--color-danger)' }} />
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Rejected</p>
              <p className="text-xl font-bold">{rejected.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Approval Queue / Request List */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h3 className="text-base font-semibold font-display flex items-center gap-2">
            <Shield size={18} /> Maker-Checker Workflow Queue
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Recipients</th>
                <th>Maker</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req, idx) => {
                const sc = statusConfig[req.status];
                return (
                  <tr key={req.id || idx}>
                    <td className="font-mono text-xs">#{req.id}</td>
                    <td>
                      <span className="badge badge-info" style={{ fontSize: '0.6rem' }}>
                        {req.request_type?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="amount">{formatCurrency(req.total_amount)}</td>
                    <td>{req.recipient_count}</td>
                    <td style={{ color: 'var(--color-text-muted)' }}>{req.maker_name || 'Alice Smith'}</td>
                    <td><span className={`badge ${sc.badge}`} style={{ fontSize: '0.6rem' }}>{sc.label}</span></td>
                    <td>
                      <div className="flex gap-2">
                        <button onClick={() => setShowDetailModal(req)} className="btn-ghost py-1 px-2" style={{ fontSize: '0.7rem' }}>
                          <Eye size={14} /> View
                        </button>
                        {isChecker && req.status === 'PENDING' && (
                          <>
                            <button onClick={() => handleDecision(req.id, 'APPROVE')} className="btn-emerald py-1 px-2" style={{ fontSize: '0.7rem' }}>
                              <CheckCircle2 size={14} />
                            </button>
                            <button onClick={() => { setShowDetailModal(req); }} className="btn-danger py-1 px-2" style={{ fontSize: '0.7rem' }}>
                              <XCircle size={14} />
                            </button>
                          </>
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

      {/* New Request Modal (Maker) */}
      {showNewRequest && (
        <div className="modal-overlay" onClick={() => setShowNewRequest(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold font-display mb-5">Submit New Request</h3>
            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Request Type</label>
                <select className="input-field" value={reqForm.requestType} onChange={e => setReqForm({ ...reqForm, requestType: e.target.value })}>
                  <option value="HIGH_VALUE_TRANSFER">High-Value Transfer</option>
                  <option value="BULK_PAYROLL">Bulk Payroll Disbursement</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Total Amount ($)</label>
                <input className="input-field" type="number" step="0.01" min="1" required value={reqForm.totalAmount} onChange={e => setReqForm({ ...reqForm, totalAmount: e.target.value })} />
              </div>
              {reqForm.requestType === 'BULK_PAYROLL' && (
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Recipient Count</label>
                  <input className="input-field" type="number" min="1" value={reqForm.recipientCount} onChange={e => setReqForm({ ...reqForm, recipientCount: e.target.value })} />
                </div>
              )}
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Recipient / Department</label>
                <input className="input-field" placeholder="e.g. Global Steel Suppliers" value={reqForm.recipientName || ''} onChange={e => setReqForm({ ...reqForm, recipientName: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Purpose</label>
                <input className="input-field" placeholder="e.g. Raw materials procurement" value={reqForm.purpose || ''} onChange={e => setReqForm({ ...reqForm, purpose: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1"><Send size={16} /> Submit for Approval</button>
                <button type="button" className="btn-ghost" onClick={() => setShowNewRequest(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail / Reject Modal */}
      {showDetailModal && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ minWidth: '500px' }}>
            <h3 className="text-lg font-semibold font-display mb-4">Request Detail — #{showDetailModal.id}</h3>

            <div className="space-y-3 mb-5">
              <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Type</span>
                <span className="text-sm font-medium">{showDetailModal.request_type?.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Amount</span>
                <span className="text-sm font-bold">{formatCurrency(showDetailModal.total_amount)}</span>
              </div>
              <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Recipients</span>
                <span className="text-sm">{showDetailModal.recipient_count}</span>
              </div>
              <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Status</span>
                <span className={`badge ${statusConfig[showDetailModal.status].badge}`} style={{ fontSize: '0.6rem' }}>
                  {statusConfig[showDetailModal.status].label}
                </span>
              </div>
              {showDetailModal.payload_json && (
                <div className="p-3 rounded-lg text-xs font-mono" style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-muted)', whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(typeof showDetailModal.payload_json === 'string' ? JSON.parse(showDetailModal.payload_json) : showDetailModal.payload_json, null, 2)}
                </div>
              )}
            </div>

            {isChecker && showDetailModal.status === 'PENDING' && (
              <div className="space-y-3 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <p className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>Checker Decision</p>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Rejection Reason (if rejecting)</label>
                  <input className="input-field" placeholder="Reason for rejection..." value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => handleDecision(showDetailModal.id, 'APPROVE')} className="btn-emerald flex-1">
                    <CheckCircle2 size={16} /> Approve
                  </button>
                  <button onClick={() => handleDecision(showDetailModal.id, 'REJECT')} className="btn-danger flex-1">
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              </div>
            )}

            <button onClick={() => setShowDetailModal(null)} className="btn-ghost w-full mt-4">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
