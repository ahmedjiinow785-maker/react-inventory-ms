import React from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const DashboardLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] dark:bg-[#0f172a] dark:text-slate-200">
      <Sidebar />
      <Navbar />
      <main className="ml-0 pt-16 md:ml-60">
        <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;
