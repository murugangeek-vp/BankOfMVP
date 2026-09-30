import React from 'react';
import {
  LayoutDashboard, PiggyBank, Wallet, Building2, Landmark,
  Settings2, ShieldCheck, PanelLeftClose, PanelLeft
} from 'lucide-react';

const ICON_MAP = {
  LayoutDashboard, PiggyBank, Wallet, Building2, Landmark, Settings2, ShieldCheck,
};

export default function Sidebar({ navItems, activePage, setActivePage, collapsed, setCollapsed }) {
  return (
    <aside
      className="fixed top-0 left-0 h-screen flex flex-col border-r z-40"
      style={{
        width: collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)',
        background: 'var(--color-bg-secondary)',
        borderColor: 'var(--color-border)',
        transition: 'width 0.3s var(--ease-smooth)',
      }}
    >
      {/* Logo Area */}
      <div className="flex items-center justify-between h-16 px-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
        {!collapsed && (
          <div className="flex items-center gap-2.5 animate-fadeIn">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3B82F6, #10B981)' }}>
              <Landmark size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold font-display tracking-tight" style={{ color: 'var(--color-text-primary)' }}>CoreBank</h1>
              <p className="text-[9px] font-medium tracking-widest uppercase" style={{ color: 'var(--color-text-muted)' }}>Enterprise</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto" style={{ background: 'linear-gradient(135deg, #3B82F6, #10B981)' }}>
            <Landmark size={18} className="text-white" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item, idx) => {
          const Icon = ICON_MAP[item.icon] || LayoutDashboard;
          const isActive = activePage === item.key;

          return (
            <button
              key={item.key}
              onClick={() => setActivePage(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative group ${collapsed ? 'justify-center' : ''}`}
              style={{
                background: isActive ? 'var(--color-blue-glow)' : 'transparent',
                color: isActive ? 'var(--color-blue)' : 'var(--color-text-secondary)',
              }}
              title={collapsed ? item.label : ''}
              id={`nav-${item.key}`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full" style={{ background: 'var(--color-blue)' }}></div>
              )}
              <Icon size={20} />
              {!collapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}

              {/* Tooltip on collapsed mode */}
              {collapsed && (
                <div className="absolute left-full ml-3 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50"
                  style={{ background: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
                >
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors"
          style={{ color: 'var(--color-text-muted)' }}
          id="sidebar-toggle"
        >
          {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
          {!collapsed && <span className="text-xs font-medium">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
