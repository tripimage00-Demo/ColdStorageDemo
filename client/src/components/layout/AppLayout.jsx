import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Dynamic header title lookup based on pathname
  const getPageTitle = (path) => {
    if (path.startsWith('/dashboard')) return 'Dashboard Overview';
    if (path.startsWith('/vehicles/')) return 'Vehicle Performance & Details';
    if (path.startsWith('/vehicles')) return 'Fleet & Vehicle Management';
    if (path.startsWith('/drivers')) return 'Driver Directory & Allocations';
    if (path.startsWith('/customers')) return 'Customer & Client Ledgers';
    if (path.startsWith('/trips')) return 'Trip Management & Dispatch';
    if (path.startsWith('/expenses')) return 'Expense & Cost Tracker';
    if (path.startsWith('/reports')) return 'Business Performance Reports';
    if (path.startsWith('/profile')) return 'System Profile & Settings';
    return 'Transport Management';
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} title={getPageTitle(location.pathname)} />

        {/* Scrollable page body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
