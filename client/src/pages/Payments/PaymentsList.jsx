import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  Printer,
  IndianRupee,
  CheckCircle2,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { paymentService } from '../../services/paymentService';
import { customerService } from '../../services/customerService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Table } from '../../components/common/Table';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/common/Select';
import { StatCard } from '../../components/common/StatCard';
import { Pagination } from '../../components/common/Pagination';
import { PaymentModal } from './PaymentModal';
import { ReceiptModal } from '../../components/common/ReceiptModal';
import { useToast } from '../../context/ToastContext';

export const PaymentsList = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  // Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const { success, error } = useToast();

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await paymentService.getAll({
        search,
        method: methodFilter,
        page,
        limit: 15,
      });
      if (res.success) {
        setPayments(res.data);
        setPagination(res.pagination || { total: res.data.length, pages: 1 });
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to fetch payment records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [search, methodFilter, page]);

  const totalCollected = payments.reduce((acc, p) => acc + (p.amount || 0), 0);

  const columns = [
    {
      header: 'Payment ID',
      accessor: 'paymentNumber',
      render: (p) => (
        <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          {p.paymentNumber}
        </span>
      ),
    },
    {
      header: 'Customer / Farmer',
      accessor: 'customer',
      render: (p) => (
        <div>
          <p className="font-bold text-slate-900">{p.customer?.name}</p>
          <p className="text-[11px] text-slate-500">{p.customer?.mobile}</p>
        </div>
      ),
    },
    {
      header: 'Payment Date',
      accessor: 'date',
      render: (p) => <span className="text-slate-600 text-xs">{formatDate(p.date)}</span>,
    },
    {
      header: 'Payment Method',
      accessor: 'paymentMethod',
      render: (p) => <Badge status={p.paymentMethod} />,
    },
    {
      header: 'Reference / UTR #',
      accessor: 'referenceNumber',
      render: (p) => (
        <span className="font-mono text-xs text-slate-600">{p.referenceNumber || '—'}</span>
      ),
    },
    {
      header: 'Amount Paid',
      accessor: 'amount',
      render: (p) => (
        <span className="font-bold text-emerald-600 text-sm">{formatCurrency(p.amount)}</span>
      ),
    },
    {
      header: 'Remarks',
      accessor: 'remarks',
      render: (p) => <span className="text-slate-500 text-xs truncate max-w-xs">{p.remarks || '—'}</span>,
    },
    {
      header: 'Receipt',
      render: (p) => (
        <Button
          size="xs"
          variant="outline"
          onClick={() => {
            setReceiptData({
              paymentNumber: p.paymentNumber,
              date: p.date,
              customer: p.customer,
              amount: p.amount,
              paymentMethod: p.paymentMethod,
              referenceNumber: p.referenceNumber,
              remarks: p.remarks,
            });
            setIsReceiptOpen(true);
          }}
        >
          <Printer className="w-3.5 h-3.5 mr-1" />
          Receipt
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Payment Collections</h1>
          <p className="text-xs text-slate-500">
            Recorded receipts, cash/UPI counter collections, and customer balance settlements
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsPaymentModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Record Payment
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total Receipts"
          value={pagination.total || payments.length}
          subtitle="Processed transactions"
          icon={CreditCard}
          iconBg="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Total Amount Collected"
          value={formatCurrency(totalCollected)}
          subtitle="All recorded receipts"
          icon={IndianRupee}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Payment Channels"
          value="Cash & UPI"
          subtitle="Instant ledger settlement"
          icon={CheckCircle2}
          iconBg="bg-purple-50 text-purple-600"
        />
        <StatCard
          title="Print Ready"
          value="100% Receipts"
          subtitle="Official GST receipts"
          icon={Printer}
          iconBg="bg-cyan-50 text-cyan-600"
        />
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Payment # or Reference..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition"
          />
        </div>

        <Select
          label=""
          value={methodFilter}
          onChange={(e) => {
            setMethodFilter(e.target.value);
            setPage(1);
          }}
          options={[
            { value: 'All', label: 'All Payment Methods' },
            { value: 'Cash', label: 'Cash' },
            { value: 'UPI', label: 'UPI / QR Code' },
            { value: 'Bank Transfer', label: 'Bank Transfer' },
            { value: 'Cheque', label: 'Cheque' },
          ]}
          className="w-48 text-xs py-2"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <Table
          columns={columns}
          data={payments}
          loading={loading}
          emptyMessage="No payment records found"
        />
        {pagination.pages > 1 && (
          <div className="p-4 border-t border-slate-100">
            <Pagination
              currentPage={page}
              totalPages={pagination.pages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSaved={fetchPayments}
        onReceiptOpen={(receipt) => {
          setReceiptData(receipt);
          setIsReceiptOpen(true);
        }}
      />

      {/* Printable Payment Receipt */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        data={receiptData}
        type="Payment Receipt"
      />
    </div>
  );
};
