import React from 'react';

const StatCard = ({ title, value, tone = 'blue', helper = '' }) => {
  const valueStyles = {
    blue: 'text-[#3b82f6]',
    emerald: 'text-[#22c55e]',
    red: 'text-[#ef4444]',
    slate: 'text-slate-900 dark:text-white',
  };

  return (
    <div className="page-card p-6">
      <div className="text-sm font-semibold text-[#64748b] dark:text-slate-400">{title}</div>
      <div className={`mt-2 text-3xl font-bold tracking-tight ${valueStyles[tone] || valueStyles.blue}`}>{value}</div>
      {helper ? <div className="mt-2 text-xs text-[#64748b] dark:text-slate-400">{helper}</div> : null}
    </div>
  );
};

export default StatCard;
