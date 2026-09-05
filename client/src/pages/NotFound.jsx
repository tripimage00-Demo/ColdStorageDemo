import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Home } from 'lucide-react';
import { Button } from '../components/common/Button';

export const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 mb-4 shadow-sm">
        <Truck className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">404</h1>
      <p className="text-base font-semibold text-slate-700 mt-2">Page Not Found</p>
      <p className="text-xs text-slate-500 max-w-sm mt-1 mb-6">
        The requested logistics management page does not exist or has been relocated.
      </p>
      <Button onClick={() => navigate('/dashboard')} variant="primary" icon={Home}>
        Return to Dashboard
      </Button>
    </div>
  );
};
