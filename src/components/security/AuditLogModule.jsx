import React, { useState, useEffect } from 'react';
import { fetchAuditLogs } from '../../services/api';
import {
  ShieldCheck, ShieldAlert, Search, Filter, RefreshCw, FileText,
  Clock, UserCheck, Key, Lock, AlertTriangle, CheckCircle2, Download
} from 'lucide-react';

export default function AuditLogModule() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [expandedLogId, setExpandedLogId] = useState(null);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await fetchAuditLogs();
      if (res.success) {
        setLogs(res.data);
      }
    } catch (err) {
      console.error("Error loading audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  // Unique actions for filter dropdown
  const uniqueActions = ['ALL', ...Array.from(new Set(logs.map(l => l.action)))];

  // Filtered logs
  const filteredLogs = logs.filter(log => {
    const matchesAction = selectedAction === 'ALL' || log.action === selectedAction;
    const q = searchQuery.toLowerCase();
    const matchesQuery = !q ||
      (log.action && log.action.toLowerCase().includes(q)) ||
      (log.user_name && log.user_name.toLowerCase().includes(q)) ||
      (log.user_role && log.user_role.toLowerCase().includes(q)) ||
      (log.ip_address && log.ip_address.toLowerCase().includes(q)) ||
      (JSON.stringify(log.details || {}).toLowerCase().includes(q));

    return matchesAction && matchesQuery;
  });

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold flex items-center space-x-1"><ShieldAlert className="w-3 h-3 inline mr-1" />CRITICAL</span>;
      case 'WARNING':
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-500/20 border border-amber-500/30 text-amber-300 font-medium flex items-center space-x-1"><AlertTriangle className="w-3 h-3 inline mr-1" />WARNING</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-medium flex items-center space-x-1"><CheckCircle2 className="w-3 h-3 inline mr-1" />INFO</span>;
    }
  };

  const exportAuditCSV = () => {
    if (!filteredLogs.length) return;
    const headers = ['ID', 'Timestamp', 'Action', 'User', 'Role', 'IP Address', 'Severity', 'Details'];
    const rows = filteredLogs.map(l => [
      l.id,
      new Date(l.created_at).toISOString(),
      l.action,
      l.user_name || 'System',
      l.user_role || 'SYSTEM',
      l.ip_address || '127.0.0.1',
      l.severity || 'INFO',
      `"${JSON.stringify(l.details || {}).replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Audit_Trail_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Security & Compliance Audit Trail</h1>
                <p className="text-slate-400 text-sm">
                  Immutable SOC2 & Regulatory compliance event log tracking maker-checker actions, loan decisions, and master configuration changes.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={exportAuditCSV}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl transition text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={loadLogs}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 rounded-xl transition text-sm font-medium"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Log</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Total Audit Events</span>
            <FileText className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2 font-mono">{logs.length}</p>
          <span className="text-xs text-slate-500">Immutable ledger records</span>
        </div>

        <div className="glass-card p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Maker-Checker Logs</span>
            <UserCheck className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-purple-400 mt-2 font-mono">
            {logs.filter(l => l.action?.includes('CHECKER') || l.action?.includes('MAKER')).length}
          </p>
          <span className="text-xs text-slate-500">Dual-custody verification events</span>
        </div>

        <div className="glass-card p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Loan Originations</span>
            <Lock className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-2 font-mono">
            {logs.filter(l => l.action?.includes('LOAN')).length}
          </p>
          <span className="text-xs text-slate-500">Evaluated credit decisions</span>
        </div>

        <div className="glass-card p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Master Data Edits</span>
            <Key className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400 mt-2 font-mono">
            {logs.filter(l => l.action?.includes('MASTER') || l.action?.includes('UPDATE')).length}
          </p>
          <span className="text-xs text-slate-500">System parameters modified</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by action, user, IP, or payload metadata..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/70 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="flex items-center space-x-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700/70">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-mono text-slate-400">Action:</span>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="bg-transparent text-xs font-mono text-blue-400 focus:outline-none cursor-pointer"
            >
              {uniqueActions.map(action => (
                <option key={action} value={action} className="bg-slate-900 text-white">{action}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800">
        {loading ? (
          <div className="py-12 flex items-center justify-center text-slate-400 font-mono text-sm space-x-2">
            <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            <span>Fetching security ledger from database...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-slate-500 font-mono text-sm">
            No audit logs found matching your filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/60 text-slate-400 text-xs uppercase border-b border-slate-800 font-mono">
                <tr>
                  <th className="py-3 px-4">Event ID</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">User / Operator</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4 text-right">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                {filteredLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id;

                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-slate-800/40 transition cursor-pointer" onClick={() => setExpandedLogId(isExpanded ? null : log.id)}>
                        <td className="py-3.5 px-4 text-slate-500">#{log.id}</td>
                        <td className="py-3.5 px-4 text-slate-300 flex items-center space-x-1.5 whitespace-nowrap">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{new Date(log.created_at).toLocaleString()}</span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-blue-400">{log.action}</td>
                        <td className="py-3.5 px-4 text-white font-medium">{log.user_name || 'System Auto'}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                            {log.user_role || 'SYSTEM'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">{log.ip_address || '127.0.0.1'}</td>
                        <td className="py-3.5 px-4">{getSeverityBadge(log.severity)}</td>
                        <td className="py-3.5 px-4 text-right">
                          <button className="text-xs text-blue-400 hover:underline font-sans">
                            {isExpanded ? 'Hide Details' : 'View Payload'}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded JSON Details Row */}
                      {isExpanded && (
                        <tr className="bg-slate-950/90 border-l-2 border-blue-500">
                          <td colSpan="8" className="p-4">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                                <span>Audit Event Details Payload (JSON)</span>
                                <span>Recorded by PostgreSQL Engine</span>
                              </div>
                              <pre className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-emerald-400 font-mono text-xs overflow-x-auto">
                                {JSON.stringify(log.details || {}, null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
