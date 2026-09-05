import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  FileSpreadsheet,
  Printer,
  Download,
  Calendar,
  Filter,
  Boxes,
  IndianRupee,
  ThermometerSnowflake,
  ArrowDownToLine,
  ArrowUpFromLine,
} from 'lucide-react';
import { reportService } from '../../services/reportService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  exportStockReportPDF,
  exportStockReportExcel,
  exportFinancialReportPDF,
  exportFinancialReportExcel,
  exportDataToCSV,
} from '../../utils/exportUtils';
import { StatCard } from '../../components/common/StatCard';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/common/Select';
import { Input } from '../../components/common/Input';
import { Loader } from '../../components/common/Loader';
import { Table } from '../../components/common/Table';
import { Badge } from '../../components/common/Badge';
import { useToast } from '../../context/ToastContext';

export const ReportsPage = () => {
  const [activeReportTab, setActiveReportTab] = useState('stock'); // 'stock' | 'financial' | 'capacity'
  const [timeframe, setTimeframe] = useState('This Month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [stockData, setStockData] = useState(null);
  const [finData, setFinData] = useState(null);
  const [capData, setCapData] = useState(null);
  const [loading, setLoading] = useState(true);

  const { success, error } = useToast();

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = { timeframe, startDate, endDate };

      if (activeReportTab === 'stock') {
        const res = await reportService.getStockReports(params);
        if (res.success) setStockData(res.data);
      } else if (activeReportTab === 'financial') {
        const res = await reportService.getFinancialReports(params);
        if (res.success) setFinData(res.data);
      } else if (activeReportTab === 'capacity') {
        const res = await reportService.getCapacityReports(params);
        if (res.success) setCapData(res.data);
      }
    } catch (err) {
      error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [activeReportTab, timeframe, startDate, endDate]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    if (activeReportTab === 'stock' && stockData) {
      exportStockReportPDF(stockData, { timeframe });
      success('Stock report PDF generated');
    } else if (activeReportTab === 'financial' && finData) {
      exportFinancialReportPDF(finData, { timeframe });
      success('Financial report PDF generated');
    } else {
      window.print();
    }
  };

  const handleExportExcel = () => {
    if (activeReportTab === 'stock' && stockData) {
      exportStockReportExcel(stockData, { timeframe });
      success('Stock report Excel spreadsheet downloaded');
    } else if (activeReportTab === 'financial' && finData) {
      exportFinancialReportExcel(finData, { timeframe });
      success('Financial report Excel spreadsheet downloaded');
    } else if (activeReportTab === 'capacity' && capData) {
      exportDataToCSV(capData.chambers || [], 'Chamber_Capacity_Report.csv');
      success('Capacity report CSV downloaded');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Facility Analytics & Reports</h1>
          <p className="text-xs text-slate-500">
            Audit-ready reports for stock inventories, revenue collections, and chamber space utilization
          </p>
        </div>

        {/* Action Buttons (Requirement 13) */}
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-1.5" />
            Print
          </Button>
          <Button size="sm" variant="outline" onClick={handleExportPDF}>
            <Download className="w-4 h-4 mr-1.5 text-rose-600" />
            Export PDF
          </Button>
          <Button size="sm" variant="primary" onClick={handleExportExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <FileSpreadsheet className="w-4 h-4 mr-1.5" />
            Export Excel / CSV
          </Button>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="flex items-center space-x-3 border-b border-slate-200 print:hidden text-xs font-bold">
        <button
          onClick={() => setActiveReportTab('stock')}
          className={`pb-3 px-1 border-b-2 flex items-center space-x-2 transition ${
            activeReportTab === 'stock'
              ? 'border-cyan-600 text-cyan-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Stock & Movement Reports</span>
        </button>

        <button
          onClick={() => setActiveReportTab('financial')}
          className={`pb-3 px-1 border-b-2 flex items-center space-x-2 transition ${
            activeReportTab === 'financial'
              ? 'border-cyan-600 text-cyan-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <IndianRupee className="w-4 h-4" />
          <span>Financial & Collections Reports</span>
        </button>

        <button
          onClick={() => setActiveReportTab('capacity')}
          className={`pb-3 px-1 border-b-2 flex items-center space-x-2 transition ${
            activeReportTab === 'capacity'
              ? 'border-cyan-600 text-cyan-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ThermometerSnowflake className="w-4 h-4" />
          <span>Chamber Capacity & Utilization</span>
        </button>
      </div>

      {/* Timeframe Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          {['Today', 'This Week', 'This Month', 'Custom'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                timeframe === tf
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {timeframe === 'Custom' && (
          <div className="flex items-center space-x-3 text-xs">
            <Input
              label="From"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              label="To"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        )}
      </div>

      {loading ? (
        <div className="min-h-[50vh] flex items-center justify-center">
          <Loader message="Synthesizing report records..." />
        </div>
      ) : (
        <>
          {/* ================= 1. STOCK REPORT ================= */}
          {activeReportTab === 'stock' && stockData && (
            <div className="space-y-6">
              {/* Stock KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                  title="Current Active Stock"
                  value={`${(stockData.totalCurrentStock || 0).toLocaleString()} pkts`}
                  subtitle="Across all chambers"
                  icon={Boxes}
                  iconBg="bg-blue-50 text-blue-600"
                />
                <StatCard
                  title={`Inward Intake (${timeframe})`}
                  value={`${(stockData.totalInwardQty || 0).toLocaleString()} pkts`}
                  subtitle="Stock received"
                  icon={ArrowDownToLine}
                  iconBg="bg-cyan-50 text-cyan-600"
                />
                <StatCard
                  title={`Outward Dispatched (${timeframe})`}
                  value={`${(stockData.totalOutwardQty || 0).toLocaleString()} pkts`}
                  subtitle="Stock released to mandi"
                  icon={ArrowUpFromLine}
                  iconBg="bg-rose-50 text-rose-600"
                />
              </div>

              {/* Commodity-wise Breakdown */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-3">
                <h3 className="text-sm font-bold text-slate-800">Commodity-wise Stock Distribution</h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {(stockData.commodityWise || []).map((comm, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                      <p className="font-bold text-slate-900">{comm.name}</p>
                      <p className="text-base font-black text-cyan-700 mt-1">
                        {comm.quantity?.toLocaleString()} {comm.unit}s
                      </p>
                      <span className="text-[10px] text-slate-400">{comm.lotsCount} Active Lots</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Lots Audit Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">Active Inventory Lots ({stockData.activeLots?.length || 0})</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-900 text-white font-semibold uppercase text-[10px]">
                      <tr>
                        <th className="p-3">Lot #</th>
                        <th className="p-3">Customer / Farmer</th>
                        <th className="p-3">Commodity</th>
                        <th className="p-3">Chamber</th>
                        <th className="p-3">Entry Date</th>
                        <th className="p-3 text-right">Remaining Stock</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(stockData.activeLots || []).map((l) => (
                        <tr key={l.id || l._id} className="hover:bg-slate-50 transition">
                          <td className="p-3 font-mono font-bold text-cyan-700">{l.lotNumber}</td>
                          <td className="p-3 font-semibold text-slate-800">{l.customer?.name}</td>
                          <td className="p-3 text-slate-700">{l.commodity?.name}</td>
                          <td className="p-3 text-slate-600">{l.chamber?.name}</td>
                          <td className="p-3 text-slate-500">{formatDate(l.entryDate)}</td>
                          <td className="p-3 text-right font-bold text-slate-900">{l.remainingQuantity} pkts</td>
                          <td className="p-3 text-center"><Badge status={l.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= 2. FINANCIAL REPORT ================= */}
          {activeReportTab === 'financial' && finData && (
            <div className="space-y-6">
              {/* Financial KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                  title={`Payments Collected (${timeframe})`}
                  value={formatCurrency(finData.totalPaymentsCollected || 0)}
                  subtitle="Cash, UPI & Bank Receipts"
                  icon={IndianRupee}
                  iconBg="bg-emerald-50 text-emerald-600"
                />
                <StatCard
                  title={`Storage Charges Billed (${timeframe})`}
                  value={formatCurrency(finData.totalChargesBilled || 0)}
                  subtitle="Outward release tariffs"
                  icon={BarChart3}
                  iconBg="bg-blue-50 text-blue-600"
                />
                <StatCard
                  title="Total Outstanding Dues"
                  value={formatCurrency(finData.totalOutstandingBalance || 0)}
                  subtitle="Pending customer balances"
                  icon={IndianRupee}
                  iconBg="bg-rose-50 text-rose-600"
                />
              </div>

              {/* Collections Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-4 space-y-3">
                <h3 className="text-sm font-bold text-slate-800">Recorded Receipts ({finData.payments?.length || 0})</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-900 text-white font-semibold uppercase text-[10px]">
                      <tr>
                        <th className="p-3">Receipt #</th>
                        <th className="p-3">Customer</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Channel</th>
                        <th className="p-3">Reference</th>
                        <th className="p-3 text-right">Amount Paid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(finData.payments || []).map((p) => (
                        <tr key={p.id || p._id} className="hover:bg-slate-50 transition">
                          <td className="p-3 font-mono font-bold text-emerald-700">{p.paymentNumber}</td>
                          <td className="p-3 font-semibold text-slate-800">{p.customer?.name}</td>
                          <td className="p-3 text-slate-500">{formatDate(p.date)}</td>
                          <td className="p-3"><Badge status={p.paymentMethod} /></td>
                          <td className="p-3 font-mono text-slate-500">{p.referenceNumber || '—'}</td>
                          <td className="p-3 text-right font-bold text-emerald-600">{formatCurrency(p.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Outstanding Dues by Customer */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-4 space-y-3">
                <h3 className="text-sm font-bold text-slate-800">Customers with Outstanding Dues</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-900 text-white font-semibold uppercase text-[10px]">
                      <tr>
                        <th className="p-3">Customer ID</th>
                        <th className="p-3">Customer Name</th>
                        <th className="p-3">Mobile</th>
                        <th className="p-3">Location</th>
                        <th className="p-3 text-right">Outstanding Dues</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(finData.customersWithBalance || []).map((c) => (
                        <tr key={c.id || c._id} className="hover:bg-slate-50 transition">
                          <td className="p-3 font-mono text-slate-600">{c.customerId}</td>
                          <td className="p-3 font-bold text-slate-900">{c.name}</td>
                          <td className="p-3 text-slate-600">{c.mobile}</td>
                          <td className="p-3 text-slate-500">{c.village || c.district}</td>
                          <td className="p-3 text-right font-bold text-rose-600">{formatCurrency(c.outstandingBalance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= 3. CAPACITY REPORT ================= */}
          {activeReportTab === 'capacity' && capData && (
            <div className="space-y-6">
              {/* Capacity KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                  title="Total Facility Capacity"
                  value={`${(capData.totalCapacity || 0).toLocaleString()} pkts`}
                  subtitle="Maximum cold storage volume"
                  icon={ThermometerSnowflake}
                  iconBg="bg-blue-50 text-blue-600"
                />
                <StatCard
                  title="Total Occupied Space"
                  value={`${(capData.totalOccupied || 0).toLocaleString()} pkts`}
                  subtitle={`${capData.overallOccupancyPercent || 0}% overall utilization`}
                  icon={Boxes}
                  iconBg="bg-cyan-50 text-cyan-600"
                />
                <StatCard
                  title="Available Free Buffer"
                  value={`${(capData.totalAvailable || 0).toLocaleString()} pkts`}
                  subtitle="Ready for inward stock intake"
                  icon={Boxes}
                  iconBg="bg-emerald-50 text-emerald-600"
                />
              </div>

              {/* Chamber Breakdown Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-4 space-y-3">
                <h3 className="text-sm font-bold text-slate-800">Chamber Utilization & Atmosphere Status</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-900 text-white font-semibold uppercase text-[10px]">
                      <tr>
                        <th className="p-3">Chamber</th>
                        <th className="p-3">Code</th>
                        <th className="p-3">Operating Temp</th>
                        <th className="p-3 text-right">Max Capacity</th>
                        <th className="p-3 text-right">Occupied Space</th>
                        <th className="p-3 text-right">Available Buffer</th>
                        <th className="p-3 text-right">Utilization (%)</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(capData.chambers || []).map((ch) => (
                        <tr key={ch.id} className="hover:bg-slate-50 transition">
                          <td className="p-3 font-bold text-slate-900">{ch.name}</td>
                          <td className="p-3 font-mono text-cyan-700">{ch.code}</td>
                          <td className="p-3 font-bold text-slate-700">{ch.temperature}°C</td>
                          <td className="p-3 text-right text-slate-700">{ch.maxCapacity?.toLocaleString()} pkts</td>
                          <td className="p-3 text-right font-semibold text-slate-900">{ch.currentOccupancy?.toLocaleString()} pkts</td>
                          <td className="p-3 text-right font-bold text-emerald-600">{ch.availableCapacity?.toLocaleString()} pkts</td>
                          <td className="p-3 text-right font-bold text-cyan-800">{ch.occupancyPercentage}%</td>
                          <td className="p-3 text-center"><Badge status={ch.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
