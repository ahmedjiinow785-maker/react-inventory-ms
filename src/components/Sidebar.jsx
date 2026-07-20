import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FiPieChart, FiBox, FiLayers, FiTruck, FiRefreshCw, FiLogOut, FiX } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: FiPieChart },
  { to: '/products', label: 'Products', icon: FiBox },
  { to: '/categories', label: 'Categories', icon: FiLayers },
  { to: '/suppliers', label: 'Suppliers', icon: FiTruck },
  { to: '/stocktransactions', label: 'Stock Transactions', icon: FiRefreshCw },
];

const Sidebar = () => {
  const { darkMode, toggleDarkMode, logout, sidebarOpen, setSidebarOpen } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <>
      {sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={closeSidebar}
          aria-label="Close menu overlay"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-slate-200 bg-white text-slate-800 shadow-sm transition-transform duration-200 dark:border-slate-700 dark:bg-[#1e293b] dark:text-slate-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex h-full flex-col justify-between p-5">
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#22c55e] text-lg font-bold text-white">I</div>
                <div className="text-lg font-bold text-slate-900 dark:text-white">IMS Premium</div>
              </div>
              <button
                type="button"
                onClick={closeSidebar}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 md:hidden dark:hover:bg-slate-700"
                aria-label="Close menu"
              >
                <FiX />
              </button>
            </div>

            <nav className="space-y-1">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={closeSidebar}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-r-lg border-l-4 px-4 py-3 text-sm font-semibold transition ${
                      isActive
                        ? 'border-[#3b82f6] bg-[#eff6ff] text-[#3b82f6] dark:bg-blue-900/30 dark:text-blue-300'
                        : 'border-transparent text-slate-600 hover:bg-slate-100 hover:text-[#3b82f6] dark:text-slate-300 dark:hover:bg-slate-700/60'
                    }`
                  }
                >
                  <Icon className="text-base" />
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-700">
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Dark Mode</span>
              <button
                type="button"
                onClick={toggleDarkMode}
                className={`relative h-6 w-11 rounded-full transition ${darkMode ? 'bg-[#3b82f6]' : 'bg-slate-300'}`}
                aria-label="Toggle dark mode"
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${darkMode ? 'left-5' : 'left-0.5'}`}
                />
              </button>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-[#ef4444] transition hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <FiLogOut className="text-lg" />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
