import React, { useState, useEffect, createContext, useContext } from 'react';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './components/dashboard/Dashboard';
import PersonalSavingsModule from './components/savings/PersonalSavingsModule';
import CurrentAccountModule from './components/current/CurrentAccountModule';
import CorporateBankingModule from './components/corporate/CorporateBankingModule';
import LoanManagementModule from './components/loans/LoanManagementModule';
import MasterDataAdminModule from './components/admin/MasterDataAdminModule';
import AuditLogModule from './components/security/AuditLogModule';
import LoginPage from './components/auth/LoginPage';
import SessionTimeoutModal from './components/auth/SessionTimeoutModal';
import { loginUser, loginSSO, logoutUser } from './services/api';

// Role Definitions
const ROLES = {
  RETAIL_USER: { id: 1, label: 'Personal Banking', username: 'john_retail', name: 'Johnathan Doe', color: '#3B82F6' },
  CORPORATE_MAKER: { id: 2, label: 'Corporate Maker', username: 'alice_maker', name: 'Alice Smith', color: '#F59E0B' },
  CORPORATE_CHECKER: { id: 3, label: 'Corporate Checker', username: 'bob_checker', name: 'Bob Vance', color: '#8B5CF6' },
  BANK_MANAGER: { id: 4, label: 'Bank Manager', username: 'sarah_manager', name: 'Sarah Jenkins', color: '#10B981' },
};

// Navigation Items
const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', roles: ['RETAIL_USER', 'CORPORATE_MAKER', 'CORPORATE_CHECKER', 'BANK_MANAGER'] },
  { key: 'savings', label: 'Personal Savings', icon: 'PiggyBank', roles: ['RETAIL_USER', 'BANK_MANAGER'] },
  { key: 'current', label: 'Current Account', icon: 'Wallet', roles: ['RETAIL_USER', 'BANK_MANAGER'] },
  { key: 'corporate', label: 'Corporate Portal', icon: 'Building2', roles: ['CORPORATE_MAKER', 'CORPORATE_CHECKER', 'BANK_MANAGER'] },
  { key: 'loans', label: 'Loan Hub', icon: 'Landmark', roles: ['RETAIL_USER', 'BANK_MANAGER'] },
  { key: 'masterdata', label: 'Master Data Admin', icon: 'Settings2', roles: ['BANK_MANAGER'] },
  { key: 'audit', label: 'Audit & Security', icon: 'ShieldCheck', roles: ['BANK_MANAGER'] },
];

// App Context
export const AppContext = createContext();
export const useAppContext = () => useContext(AppContext);

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('cb_user');
      return savedUser ? JSON.parse(savedUser) : {
        id: 1,
        username: 'john_retail',
        full_name: 'Johnathan Doe',
        email: 'john.doe@example.com',
        role: 'RETAIL_USER'
      };
    } catch (e) {
      return null;
    }
  });

  const [currentRole, setCurrentRole] = useState(() => currentUser?.role || 'RETAIL_USER');
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (currentUser?.role && currentUser.role !== currentRole) {
      setCurrentRole(currentUser.role);
    }
  }, [currentUser]);

  const role = ROLES[currentRole] || ROLES.RETAIL_USER;
  const visibleNav = NAV_ITEMS.filter(item => item.roles.includes(currentRole));

  const handleLogin = async (credentials) => {
    const res = await loginUser(credentials);
    if (res.success && res.user) {
      localStorage.setItem('cb_token', res.token);
      localStorage.setItem('cb_user', JSON.stringify(res.user));
      localStorage.setItem('cb_last_activity', Date.now().toString());
      setCurrentUser(res.user);
      setCurrentRole(res.user.role || 'RETAIL_USER');
      setActivePage('dashboard');
      setRefreshKey(prev => prev + 1);
    } else {
      throw new Error(res.error || 'Authentication failed');
    }
  };

  const handleSSOLogin = async (ssoData) => {
    const res = await loginSSO(ssoData);
    if (res.success && res.user) {
      localStorage.setItem('cb_token', res.token);
      localStorage.setItem('cb_user', JSON.stringify(res.user));
      localStorage.setItem('cb_last_activity', Date.now().toString());
      setCurrentUser(res.user);
      setCurrentRole(res.user.role || 'RETAIL_USER');
      setActivePage('dashboard');
      setRefreshKey(prev => prev + 1);
    } else {
      throw new Error(res.error || 'Single Sign-On failed');
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      // Ignore network logout errors
    } finally {
      localStorage.removeItem('cb_token');
      localStorage.removeItem('cb_user');
      localStorage.removeItem('cb_last_activity');
      setCurrentUser(null);
    }
  };

  // When role view is switched manually in Header dropdown
  const handleRoleChange = (newRole) => {
    setCurrentRole(newRole);
    if (currentUser) {
      const updatedUser = { ...currentUser, role: newRole };
      setCurrentUser(updatedUser);
      localStorage.setItem('cb_user', JSON.stringify(updatedUser));
    }
    setActivePage('dashboard');
    setRefreshKey(prev => prev + 1);
  };

  const triggerRefresh = () => setRefreshKey(prev => prev + 1);

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard />;
      case 'savings': return <PersonalSavingsModule />;
      case 'current': return <CurrentAccountModule />;
      case 'corporate': return <CorporateBankingModule />;
      case 'loans': return <LoanManagementModule />;
      case 'masterdata': return <MasterDataAdminModule />;
      case 'audit': return <AuditLogModule />;
      default: return <Dashboard />;
    }
  };

  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLogin} onSSOLoginSuccess={handleSSOLogin} />;
  }

  return (
    <AppContext.Provider value={{
      currentUser,
      currentRole,
      role,
      ROLES,
      handleRoleChange,
      handleLogin,
      handleSSOLogin,
      handleLogout,
      activePage,
      setActivePage,
      refreshKey,
      triggerRefresh
    }}>
      <div className="flex h-screen overflow-hidden relative">
        <SessionTimeoutModal onLogout={handleLogout} />
        <Sidebar
          navItems={visibleNav}
          activePage={activePage}
          setActivePage={setActivePage}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />
        <div className="flex-1 flex flex-col overflow-hidden" style={{ marginLeft: sidebarCollapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)', transition: 'margin-left 0.3s var(--ease-smooth)' }}>
          <Header />
          <main className="flex-1 overflow-y-auto p-6" style={{ background: 'var(--color-bg-primary)' }}>
            <div key={refreshKey} className="animate-fadeIn max-w-[1440px] mx-auto">
              {renderPage()}
            </div>
          </main>
        </div>
      </div>
    </AppContext.Provider>
  );
}
