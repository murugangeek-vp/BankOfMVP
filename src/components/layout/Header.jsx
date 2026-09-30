import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../../App';
import {
  Bell, Search, ChevronDown, Shield, Users, Landmark, UserCircle,
  Building2, LogOut
} from 'lucide-react';

const ROLE_ICONS = {
  RETAIL_USER: UserCircle,
  CORPORATE_MAKER: Building2,
  CORPORATE_CHECKER: Shield,
  BANK_MANAGER: Landmark,
};

export default function Header() {
  const { currentRole, role, ROLES, handleRoleChange, currentUser, handleLogout } = useAppContext();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const roleMenuRef = useRef(null);
  const notifRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target)) setShowRoleMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const notifications = [
    { id: 1, title: 'EMI Due Reminder', desc: 'Installment #3 due on Oct 1, 2026', time: '2h ago', type: 'warning' },
    { id: 2, title: 'Payroll Batch Pending', desc: 'September salary batch awaiting Checker approval', time: '5h ago', type: 'info' },
    { id: 3, title: 'Interest Credited', desc: '$93.18 credited to Savings Account', time: '1d ago', type: 'success' },
  ];

  const RoleIcon = ROLE_ICONS[currentRole];

  return (
    <header className="flex items-center justify-between px-6 h-16 border-b" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
      {/* Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            placeholder="Search accounts, transactions..."
            className="input-field pl-10"
            style={{ background: 'var(--color-bg-card)', fontSize: '0.8rem', padding: '8px 14px 8px 36px' }}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl transition-colors hover:bg-white/5"
            id="notification-bell"
          >
            <Bell size={20} style={{ color: 'var(--color-text-secondary)' }} />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: 'var(--color-danger)' }}></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 glass-card p-0 overflow-hidden animate-scaleIn z-50" style={{ transformOrigin: 'top right' }}>
              <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
                <h4 className="font-semibold text-sm">Notifications</h4>
              </div>
              {notifications.map(n => (
                <div key={n.id} className="px-4 py-3 border-b hover:bg-white/5 cursor-pointer transition-colors" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 w-2 h-2 rounded-full flex-shrink-0" style={{
                      background: n.type === 'success' ? 'var(--color-emerald)' : n.type === 'warning' ? 'var(--color-gold)' : 'var(--color-blue)'
                    }}></div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{n.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{n.desc}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{n.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Role Switcher & User Profile */}
        <div className="relative" ref={roleMenuRef}>
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-3 px-3 py-2 rounded-xl transition-all hover:bg-white/5 border border-white/5"
            id="role-switcher"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm" style={{ background: `${role.color}20`, color: role.color }}>
              <RoleIcon size={18} />
            </div>
            <div className="text-left hidden md:block">
              <p className="text-xs font-semibold leading-tight" style={{ color: 'var(--color-text-primary)' }}>
                {currentUser?.full_name || role.name}
              </p>
              <p className="text-[10px]" style={{ color: role.color }}>{role.label}</p>
            </div>
            <ChevronDown size={14} style={{ color: 'var(--color-text-muted)' }} className={`transition-transform ${showRoleMenu ? 'rotate-180' : ''}`} />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 top-14 w-64 glass-card p-2 animate-scaleIn z-50" style={{ transformOrigin: 'top right' }}>
              <div className="px-3 py-2 border-b border-slate-800 mb-2">
                <p className="text-xs font-bold text-white">{currentUser?.full_name || role.name}</p>
                <p className="text-[11px] text-slate-400 font-mono">@{currentUser?.username || role.username}</p>
              </div>

              <div className="px-3 py-1 mb-1">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Switch Role View</p>
              </div>
              {Object.entries(ROLES).map(([key, r]) => (
                <button
                  key={key}
                  onClick={() => { handleRoleChange(key); setShowRoleMenu(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${currentRole === key ? 'bg-white/10' : 'hover:bg-white/5'}`}
                >
                  {React.createElement(ROLE_ICONS[key], { size: 18, style: { color: r.color } })}
                  <div className="text-left">
                    <p className="text-sm font-medium" style={{ color: currentRole === key ? r.color : 'var(--color-text-primary)' }}>{r.name}</p>
                    <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{r.label}</p>
                  </div>
                  {currentRole === key && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: r.color }}></div>
                  )}
                </button>
              ))}

              <div className="border-t border-slate-800 mt-2 pt-2">
                <button
                  onClick={() => { handleLogout(); setShowRoleMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition text-xs font-semibold"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
