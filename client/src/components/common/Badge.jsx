import React from 'react';

export const Badge = ({ children, status, variant, className = '' }) => {
  let badgeStyles = 'bg-slate-100 text-slate-700 border-slate-200';

  const normalized = (status || variant || '').toLowerCase();

  switch (normalized) {
    case 'active':
    case 'paid':
    case 'completed':
    case 'success':
      badgeStyles = 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-600/10';
      break;
    case 'partially paid':
    case 'in transit':
    case 'warning':
    case 'truck':
      badgeStyles = 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-600/10';
      break;
    case 'pending':
      badgeStyles = 'bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-600/10';
      break;
    case 'maintenance':
    case 'trailer':
      badgeStyles = 'bg-purple-50 text-purple-700 border-purple-200 ring-1 ring-purple-600/10';
      break;
    case 'inactive':
    case 'cancelled':
    case 'danger':
      badgeStyles = 'bg-red-50 text-red-700 border-red-200 ring-1 ring-red-600/10';
      break;
    case 'mini truck':
    case 'pickup':
    case 'info':
      badgeStyles = 'bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-600/10';
      break;
    default:
      badgeStyles = 'bg-slate-100 text-slate-700 border-slate-200';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeStyles} ${className}`}
    >
      {children || status}
    </span>
  );
};
