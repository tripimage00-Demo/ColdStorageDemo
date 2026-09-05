import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BookOpen,
  Printer,
  Search,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  User,
  Calendar,
  IndianRupee,
} from 'lucide-react';
import { ledgerService } from '../../services/ledgerService';
import { customerService } from '../../services/customerService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/common/Select';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { Loader } from '../../components/common/Loader';
import { useToast } from '../../context/ToastContext';

export const CustomerLedgerPage = () => {
  const [searchParams] = useSearchParams();
  const queryCustId = searchParams.get('customerId');

  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(queryCustId || '');
  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Filters
  const [typeFilter, setTypeFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Adjustment Modal
  const [isAdjModalOpen, setIsAdjModalOpen] = useState(false);
  const [adjData, setAdjData] = useState({ amount: '', type: 'Debit', remarks: '' });
  const [adjLoading, setAdjLoading] = useState(false);

  const { success, error } = useToast();

  const fetchCustomers = async () => {
    try {
      const res = await customerService.getAll({ limit: 100 });
      if (res.success && res.data.length > 0) {
        setCustomers(res.data);
        if (!selectedCustomerId) {
          setSelectedCustomerId(res.data[0].id || res.data[0]._id);
        }
      }
    } catch (e) {
      error('Failed to load customers');
    }
  };

  const fetchLedger = async () => {
    if (!selectedCustomerId) return;
    try {
      setLoading(true);
      const res = await ledgerService.getCustomerLedger(selectedCustomerId, {
        transactionType: typeFilter,
        startDate,
        endDate,
      });
      if (res.success) {
        setLedgerData(res.data);
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to fetch ledger statement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      fetchLedger();
    }
  }, [selectedCustomerId, typeFilter, startDate, endDate]);

  const handlePrint = () => {
    window.print();
  };

  const handleCreateAdjustment = async (e) => {
    e.preventDefault();
    if (!adjData.amount || Number(adjData.amount) <= 0) {
      error('Enter valid adjustment amount');
      return;
    }

    setAdjLoading(true);
    try {
      await ledgerService.createAdjustment({
        customerId: selectedCustomerId,
        amount: Number(adjData.amount),
        type: adjData.type,
        remarks: adjData.remarks,
      });
      success('Ledger adjustment applied successfully');
      setIsAdjModalOpen(false);
      setAdjData({ amount: '', type: 'Debit', remarks: '' });
      fetchLedger();
    } catch (err) {
      error(err.response?.data?.message || 'Adjustment failed');
    } finally {
      setAdjLoading(false);
    }
  };

  const customer = ledgerData?.customer || {};
  const transactions = ledgerData?.transactions || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Customer Account Ledger</h1>
          <p className="text-xs text-slate-500">
            Chronological audit of storage debits, payments credits, and current outstanding balances
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-1.5" />
            Print Statement
          </Button>
          <Button
            variant="primary"
            onClick={() => setIsAdjModalOpen(true)}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Adjustment
          </Button>
        </div>
      </div>

      {/* Customer Selector & Prominent Outstanding Balance Card (Requirement 14) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Select Bar */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 print:hidden">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Select Customer Account:
          </label>
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full text-sm font-semibold p-3 rounded-xl border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition bg-white"
          >
            {customers.map((c) => (
              <option key={c.id || c._id} value={c.id || c._id}>
                {c.name} ({c.mobile}) - {c.village || c.district} [Dues: ₹{(c.outstandingBalance || 0).toLocaleString()}]
              </option>
            ))}
          </select>

          {/* Date & Type Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
            <Select
              label="Transaction Filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={[
                { value: 'All', label: 'All Transactions' },
                { value: 'Storage Charge', label: 'Storage Charges (Debits)' },
                { value: 'Payment', label: 'Payments (Credits)' },
                { value: 'Adjustment', label: 'Adjustments' },
              ]}
            />
            <Input
              label="From Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              label="To Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {/* Outstanding Balance Banner Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-lg border border-slate-700 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
              Current Outstanding Balance
            </span>
            <h2 className="text-3xl font-black text-white mt-1">
              {formatCurrency(ledgerData?.currentOutstandingBalance || 0)}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {customer.name ? `${customer.name} (${customer.mobile})` : 'Select a customer'}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-700/80 flex justify-between text-xs">
            <div>
              <span className="text-slate-400 block">Total Debits:</span>
              <strong className="text-rose-400 font-bold">{formatCurrency(ledgerData?.totalDebit || 0)}</strong>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block">Total Payments:</span>
              <strong className="text-emerald-400 font-bold">{formatCurrency(ledgerData?.totalCredit || 0)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Printable Ledger Statement Paper */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 overflow-hidden" id="ledger-printable">
        {/* Printable Statement Header */}
        <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black text-slate-900">SmartCold Storage Management</h1>
              <p className="text-xs text-slate-600">Customer Account Statement & Ledger</p>
              <p className="text-xs text-slate-500">Agra Highway Bypass, Uttar Pradesh - GSTIN: 09AAACS1234F1Z5</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-900">{customer.name}</p>
              <p className="text-xs text-slate-600">Mobile: {customer.mobile}</p>
              <p className="text-xs text-slate-500">Date: {new Date().toLocaleDateString('en-IN')}</p>
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900 text-white font-semibold uppercase text-[10px]">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Type</th>
                <th className="p-3">Reference / Receipt #</th>
                <th className="p-3">Description / Remarks</th>
                <th className="p-3 text-right">Debit (Charge)</th>
                <th className="p-3 text-right">Credit (Payment)</th>
                <th className="p-3 text-right">Running Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">
                    <Loader message="Loading transactions..." />
                  </td>
                </tr>
              ) : transactions.length > 0 ? (
                transactions.map((t, idx) => (
                  <tr key={t.id || t._id || idx} className="hover:bg-slate-50 transition">
                    <td className="p-3 text-slate-600 whitespace-nowrap">{formatDate(t.date)}</td>
                    <td className="p-3 font-semibold">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.transactionType === 'Payment'
                            ? 'bg-emerald-50 text-emerald-700'
                            : t.transactionType === 'Storage Charge'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {t.transactionType}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-800">{t.reference}</td>
                    <td className="p-3 text-slate-600 max-w-sm">{t.remarks || '—'}</td>
                    <td className="p-3 text-right font-semibold text-rose-600">
                      {t.debit > 0 ? formatCurrency(t.debit) : '—'}
                    </td>
                    <td className="p-3 text-right font-semibold text-emerald-600">
                      {t.credit > 0 ? formatCurrency(t.credit) : '—'}
                    </td>
                    <td className="p-3 text-right font-bold text-slate-900">
                      {formatCurrency(t.balance)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">
                    No transactions recorded for this customer account.
                  </td>
                </tr>
              )}
            </tbody>
            {transactions.length > 0 && (
              <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-200">
                <tr>
                  <td colSpan="4" className="p-3 text-right text-slate-700 uppercase tracking-wider">
                    Statement Totals:
                  </td>
                  <td className="p-3 text-right text-rose-600">{formatCurrency(ledgerData?.totalDebit || 0)}</td>
                  <td className="p-3 text-right text-emerald-600">{formatCurrency(ledgerData?.totalCredit || 0)}</td>
                  <td className="p-3 text-right text-slate-900 font-black">
                    {formatCurrency(ledgerData?.currentOutstandingBalance || 0)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Manual Adjustment Modal */}
      <Modal
        isOpen={isAdjModalOpen}
        onClose={() => setIsAdjModalOpen(false)}
        title="Create Ledger Adjustment"
        subtitle={`Manual balance adjustment for ${customer.name || 'Customer'}`}
        size="md"
      >
        <form onSubmit={handleCreateAdjustment} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Adjustment Amount (₹) *"
              type="number"
              value={adjData.amount}
              onChange={(e) => setAdjData({ ...adjData, amount: e.target.value })}
              placeholder="e.g. 500"
              required
            />

            <Select
              label="Adjustment Type"
              value={adjData.type}
              onChange={(e) => setAdjData({ ...adjData, type: e.target.value })}
              options={[
                { value: 'Debit', label: 'Debit (Increase Customer Due)' },
                { value: 'Credit', label: 'Credit (Reduce Customer Due / Discount)' },
              ]}
            />
          </div>

          <Input
            label="Reason / Authorized By *"
            value={adjData.remarks}
            onChange={(e) => setAdjData({ ...adjData, remarks: e.target.value })}
            placeholder="e.g. Rounding off / Waiver agreed by manager"
            required
          />

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsAdjModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={adjLoading}>
              Apply Adjustment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
