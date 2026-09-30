import React, { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, Clock, RefreshCw, LogOut, Lock } from 'lucide-react';
import { refreshSession } from '../../services/api';

const INACTIVITY_TIMEOUT_MS = 12 * 60 * 1000; // 12 minutes idle trigger
const COUNTDOWN_SECONDS = 180; // 3 minutes warning countdown

export default function SessionTimeoutModal({ onLogout }) {
  const [showModal, setShowModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(COUNTDOWN_SECONDS);
  const [refreshing, setRefreshing] = useState(false);

  const resetIdleTimer = useCallback(() => {
    if (showModal) return; // Don't reset if modal is already open
    localStorage.setItem('cb_last_activity', Date.now().toString());
  }, [showModal]);

  // Monitor user activity
  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    events.forEach(ev => window.addEventListener(ev, resetIdleTimer));

    const checkInterval = setInterval(() => {
      const last = parseInt(localStorage.getItem('cb_last_activity') || Date.now().toString(), 10);
      const elapsed = Date.now() - last;

      if (elapsed >= INACTIVITY_TIMEOUT_MS && !showModal) {
        setShowModal(true);
        setTimeLeft(COUNTDOWN_SECONDS);
      }
    }, 10000);

    return () => {
      events.forEach(ev => window.removeEventListener(ev, resetIdleTimer));
      clearInterval(checkInterval);
    };
  }, [resetIdleTimer, showModal]);

  // Countdown timer when modal is open
  useEffect(() => {
    if (!showModal) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showModal, onLogout]);

  const handleExtendSession = async () => {
    setRefreshing(true);
    try {
      await refreshSession();
      localStorage.setItem('cb_last_activity', Date.now().toString());
      setShowModal(false);
    } catch (e) {
      onLogout();
    } finally {
      setRefreshing(false);
    }
  };

  if (!showModal) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-card max-w-md w-full p-6 rounded-3xl border border-amber-500/40 bg-slate-900 shadow-2xl space-y-5 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Session Expiry Warning</h3>
            <p className="text-xs text-amber-400/90 font-mono">SOC2 Inactivity Security Protocol</p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Your secure banking session has been idle for 12 minutes. To protect your financial accounts, your session will automatically terminate in:
        </p>

        {/* Countdown Box */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center font-mono space-y-1">
          <div className="flex items-center justify-center space-x-2 text-2xl font-black text-amber-400">
            <Clock className="w-6 h-6 animate-pulse" />
            <span>{formattedTime}</span>
          </div>
          <span className="text-[11px] text-slate-500">Auto-Logout Timer</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onLogout}
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center space-x-1.5 transition border border-slate-700"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Now</span>
          </button>
          
          <button
            type="button"
            onClick={handleExtendSession}
            disabled={refreshing}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-bold flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-900/30 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Stay Signed In</span>
          </button>
        </div>

        <div className="flex items-center justify-center space-x-1 text-[10px] text-slate-500 font-mono pt-1">
          <Lock className="w-3 h-3 text-slate-600" />
          <span>CoreBank Security Layer • Token Auto-Renewal</span>
        </div>
      </div>
    </div>
  );
}
