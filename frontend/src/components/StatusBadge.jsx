import React from 'react';

const StatusBadge = ({ status }) => {
  const getStyles = () => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'INACTIVE':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'OUT_OF_SERVICE':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    }
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStyles()}`}>
      {status ? status.replace(/_/g, ' ') : ''}
    </span>
  );
};

export default StatusBadge;
