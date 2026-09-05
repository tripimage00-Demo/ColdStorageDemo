import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/layout/AppLayout';
import { Loader } from './components/common/Loader';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Lazy load pages for fast initial bundle
const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })));
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const CustomersList = lazy(() => import('./pages/Customers/CustomersList').then((m) => ({ default: m.CustomersList })));
const CustomerDetail = lazy(() => import('./pages/Customers/CustomerDetail').then((m) => ({ default: m.CustomerDetail })));
const StockInwardForm = lazy(() => import('./pages/StockInward/StockInwardForm').then((m) => ({ default: m.StockInwardForm })));
const InventoryList = lazy(() => import('./pages/Inventory/InventoryList').then((m) => ({ default: m.InventoryList })));
const StockReleaseForm = lazy(() => import('./pages/StockRelease/StockReleaseForm').then((m) => ({ default: m.StockReleaseForm })));
const ChambersList = lazy(() => import('./pages/Chambers/ChambersList').then((m) => ({ default: m.ChambersList })));
const CommoditiesList = lazy(() => import('./pages/Commodities/CommoditiesList').then((m) => ({ default: m.CommoditiesList })));
const PaymentsList = lazy(() => import('./pages/Payments/PaymentsList').then((m) => ({ default: m.PaymentsList })));
const CustomerLedgerPage = lazy(() => import('./pages/CustomerLedger/CustomerLedgerPage').then((m) => ({ default: m.CustomerLedgerPage })));
const ReportsPage = lazy(() => import('./pages/Reports/ReportsPage').then((m) => ({ default: m.ReportsPage })));
const SettingsPage = lazy(() => import('./pages/Settings/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const NotFound = lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })));

// Background prefetch for instant route navigation
const preloadRouteChunks = () => {
  const loaders = [
    () => import('./pages/Dashboard'),
    () => import('./pages/Customers/CustomersList'),
    () => import('./pages/Inventory/InventoryList'),
    () => import('./pages/StockInward/StockInwardForm'),
    () => import('./pages/StockRelease/StockReleaseForm'),
    () => import('./pages/Chambers/ChambersList'),
    () => import('./pages/Commodities/CommoditiesList'),
    () => import('./pages/Payments/PaymentsList'),
    () => import('./pages/CustomerLedger/CustomerLedgerPage'),
    () => import('./pages/Reports/ReportsPage'),
    () => import('./pages/Settings/SettingsPage'),
  ];

  const runPrefetch = () => {
    loaders.forEach((loader) => loader().catch(() => {}));
  };

  if (typeof window !== 'undefined') {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(runPrefetch, { timeout: 2000 });
    } else {
      setTimeout(runPrefetch, 800);
    }
  }
};

// Protected Route
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader message="Authenticating SmartCold session..." className="text-white" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Only Route (for login page)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  useEffect(() => {
    preloadRouteChunks();
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <Suspense
              fallback={
                <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                  <Loader message="Loading page..." className="text-slate-600" />
                </div>
              }
            >
              <Routes>
                {/* Public Auth Route */}
                <Route
                  path="/login"
                  element={
                    <PublicRoute>
                      <Login />
                    </PublicRoute>
                  }
                />

                {/* Protected Application Routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="customers" element={<CustomersList />} />
                  <Route path="customers/:id" element={<CustomerDetail />} />
                  <Route path="stock-inward" element={<StockInwardForm />} />
                  <Route path="inventory" element={<InventoryList />} />
                  <Route path="stock-release" element={<StockReleaseForm />} />
                  <Route path="chambers" element={<ChambersList />} />
                  <Route path="commodities" element={<CommoditiesList />} />
                  <Route path="payments" element={<PaymentsList />} />
                  <Route path="ledger" element={<CustomerLedgerPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>

                {/* Fallback 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
