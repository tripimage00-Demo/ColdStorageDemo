import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  MapPin,
  FileText,
  Boxes,
  ArrowDownToLine,
  ArrowUpFromLine,
  CreditCard,
  BookOpen,
  Calendar,
  ShieldCheck,
  Plus,
} from 'lucide-react';
import { customerService } from '../../services/customerService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Loader } from '../../components/common/Loader';
import { PaymentModal } from '../Payments/PaymentModal';
import { ReceiptModal } from '../../components/common/ReceiptModal';
import { useToast } from '../../context/ToastContext';

export const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { error } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('lots'); // 'lots' | 'inward' | 'releases' | 'payments'

  // Payment Modal
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await customerService.getById(id);
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to load customer profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader message="Loading customer profile & stock history..." />
      </div>
    );
  }

  const customer = data?.customer || {};
  const lots = data?.lots || [];
  const inwardEntries = data?.inwardEntries || [];
  const releases = data?.releases || [];
  const payments = data?.payments || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/customers')}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                {customer.customerId || 'CUST-XXXX'}
              </span>
              <Badge status={customer.status} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">{customer.name}</h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => navigate(`/ledger?customerId=${customer.id || customer._id}`)}
          >
            <BookOpen className="w-4 h-4 mr-1.5 text-slate-500" />
            View Full Ledger
          </Button>

          <Button
            variant="primary"
            onClick={() => setIsPaymentOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <CreditCard className="w-4 h-4 mr-1.5" />
            Record Payment
          </Button>
        </div>
      </div>

      {/* Customer Info Card & Summary KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Profile Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Contact & Address
          </h2>
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center text-slate-700">
              <Phone className="w-4 h-4 mr-2 text-slate-400" />
              <span>{customer.mobile} {customer.altMobile && `• ${customer.altMobile}`}</span>
            </div>
            <div className="flex items-start text-slate-700">
              <MapPin className="w-4 h-4 mr-2 text-slate-400 mt-0.5" />
              <div>
                <p>{customer.address || '—'}</p>
                <p className="text-[11px] text-slate-400">{customer.village}, {customer.district}, {customer.state}</p>
              </div>
            </div>
            {customer.gstNumber && (
              <div className="flex items-center text-slate-700">
                <FileText className="w-4 h-4 mr-2 text-slate-400" />
                <span>GSTIN: <strong>{customer.gstNumber}</strong></span>
              </div>
            )}
          </div>

          {customer.notes && (
            <div className="pt-3 border-t border-slate-100 text-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Notes</p>
              <p className="text-slate-600 italic bg-slate-50 p-2 rounded-lg">{customer.notes}</p>
            </div>
          )}
        </div>

        {/* 3 Metric Summary Cards (Requirement 3) */}
        <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            title="Current Stored Stock"
            value={`${(data.currentStoredStock || 0).toLocaleString()} pkts`}
            subtitle="Goods in chambers"
            icon={Boxes}
            iconBg="bg-cyan-50 text-cyan-600"
          />

          <StatCard
            title="Total Stored To Date"
            value={`${(data.totalQuantityStored || 0).toLocaleString()} pkts`}
            subtitle="Lifetime inward intake"
            icon={ArrowDownToLine}
            iconBg="bg-blue-50 text-blue-600"
          />

          <StatCard
            title="Total Released"
            value={`${(data.totalQuantityReleased || 0).toLocaleString()} pkts`}
            subtitle="Outward dispatches"
            icon={ArrowUpFromLine}
            iconBg="bg-purple-50 text-purple-600"
          />

          <StatCard
            title="Outstanding Dues"
            value={formatCurrency(data.outstandingBalance || 0)}
            subtitle="Payable storage charges"
            icon={CreditCard}
            iconBg="bg-rose-50 text-rose-600"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex space-x-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('lots')}
          className={`pb-3 border-b-2 transition ${
            activeTab === 'lots'
              ? 'border-cyan-600 text-cyan-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Active Stored Lots ({lots.filter((l) => l.remainingQuantity > 0).length})
        </button>
        <button
          onClick={() => setActiveTab('inward')}
          className={`pb-3 border-b-2 transition ${
            activeTab === 'inward'
              ? 'border-cyan-600 text-cyan-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Inward Stock History ({inwardEntries.length})
        </button>
        <button
          onClick={() => setActiveTab('releases')}
          className={`pb-3 border-b-2 transition ${
            activeTab === 'releases'
              ? 'border-cyan-600 text-cyan-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Stock Dispatches ({releases.length})
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-3 border-b-2 transition ${
            activeTab === 'payments'
              ? 'border-cyan-600 text-cyan-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Payment Receipts ({payments.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-4">
        {/* 1. Active Lots */}
        {activeTab === 'lots' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Lot Number</th>
                  <th className="p-3">Commodity</th>
                  <th className="p-3">Chamber</th>
                  <th className="p-3">Entry Date</th>
                  <th className="p-3 text-right">Original Qty</th>
                  <th className="p-3 text-right">Released Qty</th>
                  <th className="p-3 text-right">Remaining Stock</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lots.length > 0 ? (
                  lots.map((l) => (
                    <tr key={l.id || l._id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-mono font-bold text-cyan-700">{l.lotNumber}</td>
                      <td className="p-3 font-medium">{l.commodity?.name}</td>
                      <td className="p-3 text-slate-600">{l.chamber?.name}</td>
                      <td className="p-3 text-slate-500">{formatDate(l.entryDate)}</td>
                      <td className="p-3 text-right">{l.originalQuantity} pkts</td>
                      <td className="p-3 text-right text-slate-500">{l.releasedQuantity} pkts</td>
                      <td className="p-3 text-right font-bold text-slate-900">{l.remainingQuantity} pkts</td>
                      <td className="p-3 text-center"><Badge status={l.status} /></td>
                      <td className="p-3 text-right">
                        {l.remainingQuantity > 0 && (
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => navigate(`/stock-release?lotId=${l.id || l._id}`)}
                            className="border-rose-200 text-rose-700 hover:bg-rose-50"
                          >
                            Release
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="p-6 text-center text-slate-400">No active stock lots found for this customer.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. Inward History */}
        {activeTab === 'inward' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Entry #</th>
                  <th className="p-3">Receipt #</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Commodity</th>
                  <th className="p-3">Chamber</th>
                  <th className="p-3 text-right">Quantity</th>
                  <th className="p-3">Vehicle #</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inwardEntries.length > 0 ? (
                  inwardEntries.map((e) => (
                    <tr key={e.id || e._id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-mono font-bold text-slate-800">{e.entryNumber}</td>
                      <td className="p-3 font-mono text-cyan-700">{e.receiptNumber}</td>
                      <td className="p-3 text-slate-500">{formatDate(e.date)}</td>
                      <td className="p-3 font-medium">{e.commodity?.name}</td>
                      <td className="p-3 text-slate-600">{e.chamber?.name}</td>
                      <td className="p-3 text-right font-bold text-slate-900">{e.quantity} pkts</td>
                      <td className="p-3 text-slate-500">{e.vehicleNumber || '—'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="p-6 text-center text-slate-400">No inward intake records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. Releases */}
        {activeTab === 'releases' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Release #</th>
                  <th className="p-3">Receipt #</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Lot #</th>
                  <th className="p-3 text-right">Released Qty</th>
                  <th className="p-3 text-right">Storage Charges</th>
                  <th className="p-3 text-right">Payment Received</th>
                  <th className="p-3 text-right">Balance Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {releases.length > 0 ? (
                  releases.map((r) => (
                    <tr key={r.id || r._id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-mono font-bold text-slate-800">{r.releaseNumber}</td>
                      <td className="p-3 font-mono text-cyan-700">{r.receiptNumber}</td>
                      <td className="p-3 text-slate-500">{formatDate(r.releaseDate)}</td>
                      <td className="p-3 font-mono text-slate-600">{r.lot?.lotNumber}</td>
                      <td className="p-3 text-right font-bold text-rose-600">-{r.releaseQuantity} pkts</td>
                      <td className="p-3 text-right font-semibold text-slate-900">{formatCurrency(r.actualCharges)}</td>
                      <td className="p-3 text-right text-emerald-600 font-semibold">{formatCurrency(r.paymentReceived)}</td>
                      <td className="p-3 text-right font-bold text-slate-900">{formatCurrency(r.remainingBalance)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="p-6 text-center text-slate-400">No stock dispatches recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Payments */}
        {activeTab === 'payments' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Payment #</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Reference / UTR</th>
                  <th className="p-3 text-right">Amount Paid</th>
                  <th className="p-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.length > 0 ? (
                  payments.map((p) => (
                    <tr key={p.id || p._id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-mono font-bold text-emerald-700">{p.paymentNumber}</td>
                      <td className="p-3 text-slate-500">{formatDate(p.date)}</td>
                      <td className="p-3"><Badge status={p.paymentMethod} /></td>
                      <td className="p-3 font-mono text-slate-500">{p.referenceNumber || '—'}</td>
                      <td className="p-3 text-right font-bold text-emerald-600">{formatCurrency(p.amount)}</td>
                      <td className="p-3 text-slate-500">{p.remarks || '—'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="p-6 text-center text-slate-400">No payments recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onSaved={fetchProfile}
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
