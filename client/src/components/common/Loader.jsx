import React from 'react';
import { Loader2 } from 'lucide-react';

export const Loader = ({ message = 'Loading...', size = 'md', className = '' }) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 space-y-3 ${className}`}>
      <Loader2 className={`animate-spin text-emerald-600 ${size === 'lg' ? 'w-10 h-10' : size === 'sm' ? 'w-4 h-4' : 'w-7 h-7'}`} />
      {message && <p className="text-xs font-medium text-slate-500">{message}</p>}
    </div>
  );
};
