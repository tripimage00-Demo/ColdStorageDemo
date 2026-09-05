import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Boxes,
  ArrowDownToLine,
  ArrowUpFromLine,
  Users,
  CreditCard,
  FileSpreadsheet,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Snowflake,
  TrendingUp,
  Plus,
  ArrowRight,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { dashboardService } from '../services/dashboardService';
import { formatCurrency, formatDate } from '../utils/formatters';
import { StatCard } from '../components/common/StatCard';
import { Button } from '../components/common/Button';
import { Loader } from '../components/common/Loader';
import { InwardOutwardChart } from '../components/charts/InwardOutwardChart';
import { CommodityPieChart } from '../components/charts/CommodityPieChart';
import { PaymentMonthlyChart } from '../components/charts/PaymentMonthlyChart';
import { CustomerModal } from './Customers/CustomerModal';
import { PaymentModal } from './Payments/PaymentModal';
import { ReceiptModal } from '../components/common/ReceiptModal';
import { useToast } from '../context/ToastContext';

export const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const navigate = useNavigate();
  const { error } = useToast();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await dashboardService.getStats();
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader message="Loading cold storage status & capacity metrics..." />
      </div>
    );
  }

  const stats = data?.stats || {};
  const chambers = data?.chambers || [];
  const alerts = data?.alerts || [];
  const recentActivity = data?.recentActivity || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
              <Snowflake className="w-3 h-3 mr-1" /> Live Facility Monitoring
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
              {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight mt-1">
            SmartCold Facility Overview
          </h1>
          <p className="text-xs text-slate-500">
            Automated stock movement, temperature regulation, and financial accounting
          </p>
        </div>

        {/* Quick Actions (Requirement 20) */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={() => navigate('/stock-inward')}
            className="bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm shadow-cyan-600/20"
          >
            <ArrowDownToLine className="w-4 h-4 mr-1.5" />
            Add Stock
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/stock-release')}
            className="border-rose-200 text-rose-700 hover:bg-rose-50"
          >
            <ArrowUpFromLine className="w-4 h-4 mr-1.5" />
            Release Stock
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsCustomerModalOpen(true)}
          >
            <Users className="w-4 h-4 mr-1.5 text-slate-500" />
            Add Customer
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsPaymentModalOpen(true)}
          >
            <CreditCard className="w-4 h-4 mr-1.5 text-emerald-600" />
            Record Payment
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/inventory')}
          >
            <Boxes className="w-4 h-4 mr-1.5 text-slate-500" />
            View Inventory
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/reports')}
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5 text-slate-500" />
            Reports
          </Button>
        </div>
      </div>

      {/* Primary Storage Capacity Progress Card (Requirement 2) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-md">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                Storage Capacity Utilization
              </span>
              <span className="text-[11px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full font-bold border border-cyan-500/30">
                {stats.occupancyPercentage}% Occupied
              </span>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-white">
              {stats.currentlyOccupied?.toLocaleString()} <span className="text-sm font-normal text-slate-400">/ {stats.totalStorageCapacity?.toLocaleString()} Packets</span>
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Available buffer: <strong className="text-emerald-400">{stats.availableCapacity?.toLocaleString()} packets</strong> across all active chambers.
            </p>
          </div>

          {/* Chamber Breakdown Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
            {chambers.map((ch) => {
              const occ = ch.maxCapacity > 0 ? Math.round((ch.currentOccupancy / ch.maxCapacity) * 100) : 0;
              return (
                <div
                  key={ch.id || ch._id}
                  onClick={() => navigate('/chambers')}
                  className="bg-slate-800/80 hover:bg-slate-800 p-3.5 rounded-xl border border-slate-700/80 transition cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{ch.name}</span>
                    <span className="text-[10px] font-semibold text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/50">
                      {ch.temperature}°C
                    </span>
                  </div>
                  <div className="mt-2.5 flex items-baseline justify-between text-xs">
                    <span className="text-slate-400">{ch.currentOccupancy?.toLocaleString()} pkts</span>
                    <span className="font-bold text-slate-200">{occ}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-700 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        occ >= 85 ? 'bg-amber-500' : 'bg-cyan-400'
                      }`}
                      style={{ width: `${Math.min(occ, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-6 pt-4 border-t border-slate-800/80">
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(stats.occupancyPercentage || 0, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 mt-2 font-medium">
            <span>0 Packets</span>
            <span>Total Cold Storage Facility Capacity: {stats.totalStorageCapacity?.toLocaleString()} Packets</span>
          </div>
        </div>
      </div>

      {/* 6 Key Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Customers"
          value={stats.totalCustomers || 0}
          subtitle="Registered farmers/traders"
          icon={Users}
          iconBg="bg-blue-50 text-blue-600"
        />

        <StatCard
          title="Active Lots"
          value={stats.totalStockLots || 0}
          subtitle="Batches in cold chambers"
          icon={Boxes}
          iconBg="bg-purple-50 text-purple-600"
        />

        <StatCard
          title="Inward Today"
          value={`${(stats.stockReceivedToday || 0).toLocaleString()} pkts`}
          subtitle="Incoming stock received"
          icon={ArrowDownToLine}
          iconBg="bg-cyan-50 text-cyan-600"
        />

        <StatCard
          title="Released Today"
          value={`${(stats.stockReleasedToday || 0).toLocaleString()} pkts`}
          subtitle="Dispatched to mandi"
          icon={ArrowUpFromLine}
          iconBg="bg-rose-50 text-rose-600"
        />

        <StatCard
          title="Outstanding Dues"
          value={formatCurrency(stats.totalOutstandingPayments || 0)}
          subtitle="Pending storage charges"
          icon={AlertTriangle}
          iconBg="bg-amber-50 text-amber-600"
        />

        <StatCard
          title="Monthly Collections"
          value={formatCurrency(stats.paymentsCollectedThisMonth || 0)}
          subtitle="Current month revenue"
          icon={CreditCard}
          iconBg="bg-emerald-50 text-emerald-600"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inward vs Outward Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Monthly Inward vs Outward Movements</h3>
              <p className="text-xs text-slate-400">Stock intake vs dispatches (Last 6 Months)</p>
            </div>
            <Button size="xs" variant="outline" onClick={() => navigate('/reports')}>
              Full Report
            </Button>
          </div>
          <InwardOutwardChart data={data?.monthlyStockTrends || []} />
        </div>

        {/* Commodity Distribution Pie Chart */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Stored Commodities</h3>
              <p className="text-xs text-slate-400">Active stock breakdown</p>
            </div>
            <Button size="xs" variant="ghost" onClick={() => navigate('/commodities')}>
              Rates
            </Button>
          </div>
          <CommodityPieChart data={data?.commodityDistribution || []} />
        </div>
      </div>

      {/* Revenue Trend & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Payment Collections Area Chart */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Payment Collections Trend</h3>
              <p className="text-xs text-slate-400">Monthly storage rent receipts</p>
            </div>
            <Button size="xs" variant="outline" onClick={() => navigate('/payments')}>
              View All
            </Button>
          </div>
          <PaymentMonthlyChart data={data?.monthlyStockTrends || []} />
        </div>

        {/* Recent Activity List */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Recent Facility Activity</h3>
              <p className="text-xs text-slate-400">Audit logs & operations</p>
            </div>
          </div>
          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto text-xs">
            {recentActivity.length > 0 ? (
              recentActivity.map((act, idx) => (
                <div key={idx} className="py-2.5 flex items-start space-x-3">
                  <div className="mt-0.5 p-1.5 rounded-lg bg-slate-100 text-slate-600 flex-shrink-0">
                    {act.type === 'INWARD' && <ArrowDownToLine className="w-3.5 h-3.5 text-cyan-600" />}
                    {act.type === 'RELEASE' && <ArrowUpFromLine className="w-3.5 h-3.5 text-rose-600" />}
                    {act.type === 'PAYMENT' && <CreditCard className="w-3.5 h-3.5 text-emerald-600" />}
                    {act.type === 'CUSTOMER' && <Users className="w-3.5 h-3.5 text-blue-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{act.title}</p>
                    <p className="text-[11px] text-slate-500 line-clamp-2">{act.description}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    {formatDate(act.createdAt)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-xs text-slate-400 py-6">No recent activity records</p>
            )}
          </div>
        </div>

        {/* Cold Storage Operational Alerts (Requirement 15) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Facility & Payment Alerts</h3>
              <p className="text-xs text-slate-400">High priority system notifications</p>
            </div>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              {alerts.length} Warnings
            </span>
          </div>
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {alerts.length > 0 ? (
              alerts.map((al, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs ${
                    al.type === 'warning'
                      ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                      : al.type === 'error'
                      ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                      : 'bg-cyan-50/70 border-cyan-200 text-cyan-950'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span>{al.title}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-90">{al.message}</p>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                No active operational alerts. Facility operating at nominal levels.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSaved={fetchDashboardData}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSaved={fetchDashboardData}
        onReceiptOpen={(receipt) => {
          setReceiptData(receipt);
          setIsReceiptOpen(true);
        }}
      />

      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        data={receiptData}
        type="Payment Receipt"
      />
    </div>
  );
};
