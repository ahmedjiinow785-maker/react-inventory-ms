import React from 'react';
import { FiMenu } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { username, role, setSidebarOpen } = useAuth();

  return (
    <header className="fixed left-0 right-0 top-0 z-30 ml-0 border-b border-slate-200 bg-white px-4 py-3 md:ml-60 dark:border-slate-700 dark:bg-[#1e293b]">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden dark:text-slate-300 dark:hover:bg-slate-700"
          aria-label="Open menu"
        >
          <FiMenu className="text-xl" />
        </button>

        <div className="flex flex-1 items-center justify-end gap-3">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{username || 'User'}</span>
          <span className="inline-block rounded-full bg-[#eff6ff] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#3b82f6] dark:bg-blue-900/40 dark:text-blue-300">
            {role || 'Staff'}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
