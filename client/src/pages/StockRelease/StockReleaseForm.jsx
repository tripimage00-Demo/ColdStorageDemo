import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowUpFromLine,
  Boxes,
  Printer,
  Calculator,
  Search,
  CheckCircle2,
  AlertTriangle,
  IndianRupee,
  Clock,
  Truck,
} from 'lucide-react';
import { stockService } from '../../services/stockService';
import { lotService } from '../../services/lotService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Table } from '../../components/common/Table';
import { ReceiptModal } from '../../components/common/ReceiptModal';
import { useToast } from '../../context/ToastContext';

export const StockReleaseForm = () => {
  const [searchParams] = useSearchParams();
  const preSelectedLotId = searchParams.get('lotId');

  const [availableLots, setAvailableLots] = useState([]);
  const [lotSearch, setLotSearch] = useState('');
  const [selectedLot, setSelectedLot] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    lotId: '',
    releaseQuantity: '',
    customCharges: '',
    paymentReceived: '',
    vehicleNumber: '',
    remarks: '',
    releaseDate: new Date().toISOString().split('T')[0],
  });

  const [chargePreview, setChargePreview] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Releases History Table
  const [recentReleases, setRecentReleases] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Receipt Modal
  const [receiptData, setReceiptData] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const { success, error, warning } = useToast();

  const fetchLotsAndReleases = async () => {
    try {
      const [lotsRes, relRes] = await Promise.all([
        lotService.getAll({ status: 'Stored', limit: 100 }),
        stockService.getReleases({ limit: 15 }),
      ]);

      // Also get partially released lots
      const partialRes = await lotService.getAll({ status: 'Partially Released', limit: 100 });
      const allActiveLots = [...(lotsRes.data || []), ...(partialRes.data || [])];
      setAvailableLots(allActiveLots);

      if (relRes.success) setRecentReleases(relRes.data);

      // If redirected with lotId query param
      if (preSelectedLotId) {
        const found = allActiveLots.find((l) => (l.id || l._id) === preSelectedLotId);
        if (found) {
          handleSelectLot(found);
        }
      }
    } catch (err) {
      error('Failed to load active lots');
    }
  };

  useEffect(() => {
    fetchLotsAndReleases();
  }, [preSelectedLotId]);

  const handleSelectLot = (lot) => {
    setSelectedLot(lot);
    setFormData((prev) => ({
      ...prev,
      lotId: lot.id || lot._id,
      releaseQuantity: '',
      customCharges: '',
      paymentReceived: '',
    }));
    setChargePreview(null);
  };

  // Preview Storage Charges Calculation whenever releaseQuantity or releaseDate changes
  useEffect(() => {
    const fetchChargePreview = async () => {
      if (!selectedLot || !formData.releaseQuantity || Number(formData.releaseQuantity) <= 0) {
        setChargePreview(null);
        return;
      }

      setCalculating(true);
      try {
        const res = await stockService.previewCharges({
          lotId: selectedLot.id || selectedLot._id,
          quantity: Number(formData.releaseQuantity),
          releaseDate: formData.releaseDate,
        });

        if (res.success) {
          setChargePreview(res.data);
          // Set default custom charges to calculated charges
          setFormData((prev) => ({
            ...prev,
            customCharges: res.data.calculatedCharges,
          }));
        }
      } catch (err) {
        console.error('Charge preview error:', err);
      } finally {
        setCalculating(false);
      }
    };

    const debounceTimer = setTimeout(fetchChargePreview, 300);
    return () => clearTimeout(debounceTimer);
  }, [selectedLot, formData.releaseQuantity, formData.releaseDate]);

  const filteredLots = availableLots.filter((lot) => {
    const s = lotSearch.toLowerCase().trim();
    if (!s) return true;
    return (
      lot.lotNumber?.toLowerCase().includes(s) ||
      lot.customer?.name?.toLowerCase().includes(s) ||
      lot.customer?.mobile?.includes(s) ||
      lot.commodity?.name?.toLowerCase().includes(s) ||
      lot.chamber?.name?.toLowerCase().includes(s)
    );
  });

  const remainingStockAfterRelease = selectedLot
    ? Math.max(0, selectedLot.remainingQuantity - Number(formData.releaseQuantity || 0))
    : 0;

  const actualCharges =
    formData.customCharges !== '' && formData.customCharges !== undefined
      ? Number(formData.customCharges)
      : chargePreview?.calculatedCharges || 0;

  const previousDues = selectedLot?.customer?.outstandingBalance || 0;
  const paymentRec = Number(formData.paymentReceived) || 0;
  const netRemainingBalance = previousDues + actualCharges - paymentRec;

  const handleRelease = async (shouldPrint = false) => {
    if (!selectedLot) {
      error('Please select an active lot for outward release');
      return;
    }
    if (!formData.releaseQuantity || Number(formData.releaseQuantity) <= 0) {
      error('Enter a valid release quantity');
      return;
    }
    if (Number(formData.releaseQuantity) > selectedLot.remainingQuantity) {
      error(`Cannot release more than remaining stock (${selectedLot.remainingQuantity} pkts)`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await stockService.createRelease(formData);
      success('Stock released, charges billed, and customer ledger updated successfully!');

      if (shouldPrint && res.data?.receipt) {
        setReceiptData(res.data.receipt);
        setIsReceiptOpen(true);
      }

      // Reset
      setSelectedLot(null);
      setChargePreview(null);
      setFormData({
        lotId: '',
        releaseQuantity: '',
        customCharges: '',
        paymentReceived: '',
        vehicleNumber: '',
        remarks: '',
        releaseDate: new Date().toISOString().split('T')[0],
      });
      fetchLotsAndReleases();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to release stock');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Release #',
      accessor: 'releaseNumber',
      render: (r) => <span className="font-mono font-bold text-slate-800 text-xs">{r.releaseNumber}</span>,
    },
    {
      header: 'Receipt #',
      accessor: 'receiptNumber',
      render: (r) => <span className="font-mono text-cyan-700 font-semibold text-xs">{r.receiptNumber}</span>,
    },
    {
      header: 'Customer',
      accessor: 'customer',
      render: (r) => (
        <div>
          <p className="font-bold text-slate-900">{r.customer?.name}</p>
          <p className="text-[11px] text-slate-500">{r.customer?.mobile}</p>
        </div>
      ),
    },
    {
      header: 'Lot #',
      accessor: 'lot',
      render: (r) => <span className="font-mono text-xs font-semibold text-slate-700">{r.lot?.lotNumber}</span>,
    },
    {
      header: 'Released Qty',
      accessor: 'releaseQuantity',
      render: (r) => (
        <span className="font-bold text-rose-600 text-xs">
          -{r.releaseQuantity?.toLocaleString()} pkts
        </span>
      ),
    },
    {
      header: 'Storage Charges',
      accessor: 'actualCharges',
      render: (r) => <span className="font-bold text-slate-900 text-xs">{formatCurrency(r.actualCharges)}</span>,
    },
    {
      header: 'Payment Received',
      accessor: 'paymentReceived',
      render: (r) => (
        <span className="font-semibold text-emerald-600 text-xs">
          {formatCurrency(r.paymentReceived || 0)}
        </span>
      ),
    },
    {
      header: 'Net Balance',
      accessor: 'remainingBalance',
      render: (r) => (
        <span
          className={`font-bold text-xs ${
            r.remainingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'
          }`}
        >
          {formatCurrency(r.remainingBalance)}
        </span>
      ),
    },
    {
      header: 'Action',
      render: (r) => (
        <Button
          size="xs"
          variant="outline"
          onClick={() => {
            setReceiptData({
              releaseNumber: r.releaseNumber,
              receiptNumber: r.receiptNumber,
              lotNumber: r.lot?.lotNumber,
              releaseDate: r.releaseDate,
              customer: r.customer,
              commodity: r.commodity,
              chamber: r.chamber,
              releaseQuantity: r.releaseQuantity,
              remainingQuantity: r.remainingQuantity,
              storageDays: r.storageDays,
              storageMonths: r.storageMonths,
              storageCharges: r.actualCharges,
              previousBalance: r.previousBalance,
              paymentReceived: r.paymentReceived,
              remainingBalance: r.remainingBalance,
              vehicleNumber: r.vehicleNumber,
              remarks: r.remarks,
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
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Stock Release & Outward Dispatch</h1>
        <p className="text-xs text-slate-500">
          Search stored lot, calculate duration-based storage charges, record immediate payment, and generate release receipt
        </p>
      </div>

      {/* Main Workflow Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Pick Stored Lot (Requirement 8) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-cyan-50 text-cyan-600">
                <Boxes className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">1. Select Stored Lot</h2>
                <p className="text-[11px] text-slate-400">Search by Customer, Mobile, or Lot #</p>
              </div>
            </div>
            <span className="text-xs font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded">
              {filteredLots.length} Active
            </span>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search lot, customer, mobile..."
              value={lotSearch}
              onChange={(e) => setLotSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition"
            />
          </div>

          {/* Lots List */}
          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {filteredLots.length > 0 ? (
              filteredLots.map((l) => {
                const isSelected = selectedLot && (selectedLot.id || selectedLot._id) === (l.id || l._id);
                return (
                  <div
                    key={l.id || l._id}
                    onClick={() => handleSelectLot(l)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer text-xs ${
                      isSelected
                        ? 'bg-cyan-50/80 border-cyan-500 shadow-sm ring-1 ring-cyan-500/30'
                        : 'bg-slate-50/60 hover:bg-slate-100/80 border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-cyan-800">{l.lotNumber}</span>
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {l.remainingQuantity?.toLocaleString()} {l.commodity?.unit}s
                      </span>
                    </div>

                    <div className="mt-2 flex items-baseline justify-between">
                      <p className="font-bold text-slate-900">{l.customer?.name}</p>
                      <span className="text-[11px] text-slate-500">{l.chamber?.name}</span>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{l.commodity?.name}</span>
                      <span>Entry: {formatDate(l.entryDate)}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-xs text-slate-400 py-8">No matching active lots found.</p>
            )}
          </div>
        </div>

        {/* Right Column: Outward Dispatch Details & Charge Calculation (Requirement 8 & 9) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
                <ArrowUpFromLine className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900">2. Dispatch & Charge Calculation</h2>
                <p className="text-xs text-slate-400">Automated duration-based tariff computation</p>
              </div>
            </div>
            {selectedLot && (
              <span className="font-mono text-xs font-bold text-cyan-800 bg-cyan-50 px-2.5 py-1 rounded-full border border-cyan-200">
                Lot: {selectedLot.lotNumber}
              </span>
            )}
          </div>

          {!selectedLot ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              <Boxes className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              Please select a stored lot from the left panel to begin outward stock dispatch.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selected Lot Snapshot */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Customer</span>
                  <p className="font-bold text-slate-900">{selectedLot.customer?.name}</p>
                  <p className="text-[11px] text-slate-500">{selectedLot.customer?.mobile}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Commodity & Chamber</span>
                  <p className="font-semibold text-slate-800">{selectedLot.commodity?.name}</p>
                  <p className="text-[11px] text-slate-500">{selectedLot.chamber?.name}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Available Stock</span>
                  <p className="font-bold text-emerald-600 text-sm">{selectedLot.remainingQuantity?.toLocaleString()} {selectedLot.commodity?.unit}s</p>
                  <p className="text-[11px] text-slate-400">Tariff: ₹{selectedLot.storageRate}/{selectedLot.rateType}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Customer Dues</span>
                  <p className="font-bold text-rose-600 text-sm">{formatCurrency(previousDues)}</p>
                </div>
              </div>

              {/* Quantities & Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Input
                    label={`Quantity to Release (${selectedLot.commodity?.unit}s) *`}
                    name="releaseQuantity"
                    type="number"
                    value={formData.releaseQuantity}
                    onChange={(e) => setFormData({ ...formData, releaseQuantity: e.target.value })}
                    placeholder={`Max: ${selectedLot.remainingQuantity}`}
                    required
                  />
                  <div className="flex items-center space-x-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, releaseQuantity: selectedLot.remainingQuantity })}
                      className="text-[11px] font-semibold text-cyan-600 hover:underline"
                    >
                      Release Full Stock ({selectedLot.remainingQuantity})
                    </button>
                  </div>
                </div>

                <Input
                  label="Dispatch Date"
                  name="releaseDate"
                  type="date"
                  value={formData.releaseDate}
                  onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
                />

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col justify-center text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Remaining After Release</span>
                  <p className="text-sm font-bold text-slate-900 mt-1">
                    {remainingStockAfterRelease.toLocaleString()} {selectedLot.commodity?.unit}s
                  </p>
                </div>
              </div>

              {/* Transparent Charge Calculation Box (Requirement 9) */}
              {chargePreview && (
                <div className="p-4 bg-cyan-50/70 border border-cyan-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-cyan-950 flex items-center">
                      <Calculator className="w-4 h-4 mr-1.5 text-cyan-700" />
                      Automated Storage Charge Calculation
                    </span>
                    <span className="text-[11px] font-semibold text-cyan-800">
                      Duration: {chargePreview.days} Days ({chargePreview.months} Month)
                    </span>
                  </div>

                  <div className="p-2.5 bg-white/80 rounded-lg border border-cyan-100 font-mono text-xs text-slate-800">
                    {chargePreview.calculationFormula}
                  </div>

                  <p className="text-[11px] text-slate-500">
                    Calculated standard charge: <strong>{formatCurrency(chargePreview.calculatedCharges)}</strong>. You can manually adjust the actual billed charges below if authorized.
                  </p>
                </div>
              )}

              {/* Editable Charges & Payment Collection */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Storage Charges Billed (₹) *"
                  name="customCharges"
                  type="number"
                  value={formData.customCharges}
                  onChange={(e) => setFormData({ ...formData, customCharges: e.target.value })}
                  placeholder="e.g. 10000"
                  required
                />

                <Input
                  label="Immediate Payment Collected (₹)"
                  name="paymentReceived"
                  type="number"
                  value={formData.paymentReceived}
                  onChange={(e) => setFormData({ ...formData, paymentReceived: e.target.value })}
                  placeholder="e.g. 5000"
                />

                <Input
                  label="Dispatch Vehicle Number"
                  name="vehicleNumber"
                  value={formData.vehicleNumber}
                  onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value.toUpperCase() })}
                  placeholder="e.g. UP-80-XY-5511"
                />
              </div>

              {/* Net Balance Preview */}
              <div className="p-4 bg-slate-900 text-white rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-slate-400">Previous Dues: {formatCurrency(previousDues)}</span>
                  <span className="mx-2 text-slate-600">•</span>
                  <span className="text-slate-400">New Charges: +{formatCurrency(actualCharges)}</span>
                  <span className="mx-2 text-slate-600">•</span>
                  <span className="text-slate-400">Paid Now: -{formatCurrency(paymentRec)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Remaining Balance:</span>
                  <p className="text-base font-black text-cyan-300">{formatCurrency(netRemainingBalance)}</p>
                </div>
              </div>

              <Input
                label="Outward Remarks"
                name="remarks"
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                placeholder="e.g. Stock verified, loaded onto transport, gate pass issued"
              />

              {/* Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedLot(null)}
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  loading={submitting}
                  onClick={() => handleRelease(false)}
                >
                  Save Dispatch
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  loading={submitting}
                  onClick={() => handleRelease(true)}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  <Printer className="w-4 h-4 mr-1.5" />
                  Save & Print Release Receipt
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Dispatches History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-4 space-y-3">
        <h3 className="text-sm font-bold text-slate-800">Recent Outward Dispatches</h3>
        <Table
          columns={columns}
          data={recentReleases}
          loading={loadingHistory}
          emptyMessage="No stock releases recorded yet"
        />
      </div>

      {/* Release Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        data={receiptData}
        type="Stock Release Receipt"
      />
    </div>
  );
};
