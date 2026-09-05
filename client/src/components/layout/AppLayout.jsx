import React, { useState, Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Loader } from '../common/Loader';

export const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Dynamic header title lookup based on pathname
  const getPageTitle = (path) => {
    if (path.startsWith('/dashboard')) return 'SmartCold Facility Overview';
    if (path.startsWith('/stock-inward')) return 'Stock Inward (Intake)';
    if (path.startsWith('/inventory')) return 'Live Inventory & Lot Tracking';
    if (path.startsWith('/stock-release')) return 'Stock Release (Outward Dispatch)';
    if (path.startsWith('/chambers')) return 'Cold Storage Chambers & Sensors';
    if (path.startsWith('/commodities')) return 'Commodity Rates & Specifications';
    if (path.startsWith('/customers')) return 'Customer Directory & Farmer Accounts';
    if (path.startsWith('/payments')) return 'Payment Collections & Invoicing';
    if (path.startsWith('/ledger')) return 'Customer Ledger Statements';
    if (path.startsWith('/reports')) return 'Business Performance & Stock Reports';
    if (path.startsWith('/settings')) return 'Facility Configuration & Admin';
    return 'SmartCold Storage Management';
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Persistent Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} title={getPageTitle(location.pathname)} />

        {/* Scrollable page body with smooth inner suspense */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <Suspense
              fallback={
                <div className="py-20 flex items-center justify-center">
                  <Loader message="Loading view..." className="text-cyan-700" />
                </div>
              }
            >
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
};
