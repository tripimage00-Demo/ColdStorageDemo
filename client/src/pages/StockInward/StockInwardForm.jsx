import React, { useState, useEffect } from 'react';
import {
  ArrowDownToLine,
  Boxes,
  Printer,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Search,
  Truck,
  User,
  Plus,
} from 'lucide-react';
import { stockService } from '../../services/stockService';
import { customerService } from '../../services/customerService';
import { commodityService } from '../../services/commodityService';
import { chamberService } from '../../services/chamberService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import { Table } from '../../components/common/Table';
import { Badge } from '../../components/common/Badge';
import { ReceiptModal } from '../../components/common/ReceiptModal';
import { CustomerModal } from '../Customers/CustomerModal';
import { useToast } from '../../context/ToastContext';

export const StockInwardForm = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Dropdown data
  const [customers, setCustomers] = useState([]);
  const [commodities, setCommodities] = useState([]);
  const [chambers, setChambers] = useState([]);

  // Inward Form State
  const [formData, setFormData] = useState({
    customerId: '',
    commodityId: '',
    chamberId: '',
    quantity: '',
    weightPerPacket: 50,
    storageRate: '',
    rateType: 'per_month',
    vehicleNumber: '',
    driverName: '',
    qualityGrade: 'Grade A',
    remarks: '',
    date: new Date().toISOString().split('T')[0],
  });

  const [selectedChamber, setSelectedChamber] = useState(null);
  const [selectedCommodity, setSelectedCommodity] = useState(null);
  const [errors, setErrors] = useState({});

  // Receipt Modal
  const [receiptData, setReceiptData] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Customer Modal for quick adding customer
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  const { success, error, warning } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [custRes, commRes, chamRes, entriesRes] = await Promise.all([
        customerService.getAll({ limit: 100 }),
        commodityService.getAll(),
        chamberService.getAll(),
        stockService.getInwardEntries({ limit: 20 }),
      ]);

      if (custRes.success) setCustomers(custRes.data);
      if (commRes.success) setCommodities(commRes.data);
      if (chamRes.success) setChambers(chamRes.data);
      if (entriesRes.success) setEntries(entriesRes.data);
    } catch (err) {
      error('Failed to load form prerequisites');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCommodityChange = (e) => {
    const commId = e.target.value;
    const comm = commodities.find((c) => (c.id || c._id) === commId);
    setSelectedCommodity(comm || null);
    setFormData((prev) => ({
      ...prev,
      commodityId: commId,
      storageRate: comm ? comm.storageRate : prev.storageRate,
      rateType: comm ? comm.rateType : prev.rateType,
    }));
  };

  const handleChamberChange = (e) => {
    const chId = e.target.value;
    const ch = chambers.find((c) => (c.id || c._id) === chId);
    setSelectedChamber(ch || null);
    setFormData((prev) => ({ ...prev, chamberId: chId }));
  };

  const totalWeight = Number(formData.quantity || 0) * Number(formData.weightPerPacket || 0);

  // Available space in selected chamber
  const availableSpace = selectedChamber
    ? Math.max(0, selectedChamber.maxCapacity - selectedChamber.currentOccupancy)
    : 0;

  const validate = () => {
    const newErrors = {};
    if (!formData.customerId) newErrors.customerId = 'Please select a customer';
    if (!formData.commodityId) newErrors.commodityId = 'Please select a commodity';
    if (!formData.chamberId) newErrors.chamberId = 'Please select a chamber';
    if (!formData.quantity || Number(formData.quantity) <= 0) {
      newErrors.quantity = 'Enter valid quantity of packets/bags';
    } else if (Number(formData.quantity) > availableSpace) {
      newErrors.quantity = `Exceeds available chamber capacity (${availableSpace.toLocaleString()} pkts)`;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (shouldPrint = false) => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await stockService.createInward(formData);
      success('Stock inward recorded & chamber occupancy updated successfully!');

      if (shouldPrint && res.data?.receipt) {
        setReceiptData(res.data.receipt);
        setIsReceiptOpen(true);
      }

      // Reset form
      setFormData({
        customerId: '',
        commodityId: '',
        chamberId: '',
        quantity: '',
        weightPerPacket: 50,
        storageRate: '',
        rateType: 'per_month',
        vehicleNumber: '',
        driverName: '',
        qualityGrade: 'Grade A',
        remarks: '',
        date: new Date().toISOString().split('T')[0],
      });
      setSelectedChamber(null);
      setSelectedCommodity(null);
      loadData();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to save inward stock');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Entry #',
      accessor: 'entryNumber',
      render: (e) => <span className="font-mono font-bold text-slate-800 text-xs">{e.entryNumber}</span>,
    },
    {
      header: 'Receipt #',
      accessor: 'receiptNumber',
      render: (e) => <span className="font-mono text-cyan-700 font-semibold text-xs">{e.receiptNumber}</span>,
    },
    {
      header: 'Customer',
      accessor: 'customer',
      render: (e) => (
        <div>
          <p className="font-bold text-slate-900">{e.customer?.name}</p>
          <p className="text-[11px] text-slate-500">{e.customer?.mobile}</p>
        </div>
      ),
    },
    {
      header: 'Commodity',
      accessor: 'commodity',
      render: (e) => <span className="font-medium text-slate-800">{e.commodity?.name}</span>,
    },
    {
      header: 'Chamber',
      accessor: 'chamber',
      render: (e) => <span className="text-slate-600 font-medium">{e.chamber?.name}</span>,
    },
    {
      header: 'Quantity',
      accessor: 'quantity',
      render: (e) => <span className="font-bold text-slate-900 text-xs">{e.quantity?.toLocaleString()} pkts</span>,
    },
    {
      header: 'Vehicle / Driver',
      accessor: 'vehicleNumber',
      render: (e) => (
        <div className="text-slate-600 text-xs">
          <p className="font-medium">{e.vehicleNumber || '—'}</p>
          {e.driverName && <p className="text-[11px] text-slate-400">{e.driverName}</p>}
        </div>
      ),
    },
    {
      header: 'Date',
      accessor: 'date',
      render: (e) => <span className="text-slate-500 text-xs">{formatDate(e.date)}</span>,
    },
    {
      header: 'Action',
      render: (e) => (
        <Button
          size="xs"
          variant="outline"
          onClick={() => {
            setReceiptData({
              entryNumber: e.entryNumber,
              receiptNumber: e.receiptNumber,
              lotNumber: e.lotNumber,
              date: e.date,
              customer: e.customer,
              commodity: e.commodity,
              chamber: e.chamber,
              quantity: e.quantity,
              weightPerPacket: e.weightPerPacket,
              totalWeight: e.totalWeight,
              storageRate: e.storageRate,
              vehicleNumber: e.vehicleNumber,
              driverName: e.driverName,
              qualityGrade: e.qualityGrade,
              remarks: e.remarks,
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
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Stock Inward (Add Stock)</h1>
        <p className="text-xs text-slate-500">
          Register incoming agricultural goods, verify chamber capacity, assign lot ID, and generate storage receipt
        </p>
      </div>

      {/* Form Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-cyan-50 text-cyan-600">
              <ArrowDownToLine className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">New Storage Inward Entry</h2>
              <p className="text-xs text-slate-400">Auto-generates IN-2026-XXXX, LOT-2026-XXXX, and Receipt</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              size="xs"
              variant="outline"
              onClick={() => setIsCustomerModalOpen(true)}
            >
              <Plus className="w-3.5 h-3.5 mr-1 text-slate-400" />
              New Customer
            </Button>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Customer */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Customer / Farmer *
            </label>
            <select
              value={formData.customerId}
              onChange={(e) => {
                setFormData({ ...formData, customerId: e.target.value });
                if (errors.customerId) setErrors({ ...errors, customerId: null });
              }}
              className={`w-full text-xs p-3 rounded-xl border ${
                errors.customerId ? 'border-red-500' : 'border-slate-200'
              } focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition bg-white`}
            >
              <option value="">-- Choose Customer --</option>
              {customers.map((c) => (
                <option key={c.id || c._id} value={c.id || c._id}>
                  {c.name} ({c.mobile}) - {c.village || c.district}
                </option>
              ))}
            </select>
            {errors.customerId && <p className="text-[11px] text-red-500 mt-1">{errors.customerId}</p>}
          </div>

          {/* Commodity */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Commodity / Product *
            </label>
            <select
              value={formData.commodityId}
              onChange={handleCommodityChange}
              className={`w-full text-xs p-3 rounded-xl border ${
                errors.commodityId ? 'border-red-500' : 'border-slate-200'
              } focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition bg-white`}
            >
              <option value="">-- Choose Commodity --</option>
              {commodities.map((comm) => (
                <option key={comm.id || comm._id} value={comm.id || comm._id}>
                  {comm.name} ({comm.unit}) - Default: ₹{comm.storageRate}/{comm.rateType}
                </option>
              ))}
            </select>
            {errors.commodityId && <p className="text-[11px] text-red-500 mt-1">{errors.commodityId}</p>}
          </div>

          {/* Chamber */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Cold Storage Chamber *
            </label>
            <select
              value={formData.chamberId}
              onChange={handleChamberChange}
              className={`w-full text-xs p-3 rounded-xl border ${
                errors.chamberId ? 'border-red-500' : 'border-slate-200'
              } focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition bg-white`}
            >
              <option value="">-- Choose Chamber --</option>
              {chambers.map((ch) => {
                const avail = Math.max(0, ch.maxCapacity - ch.currentOccupancy);
                return (
                  <option key={ch.id || ch._id} value={ch.id || ch._id} disabled={ch.status === 'Full' || avail === 0}>
                    {ch.name} ({ch.chamberCode}) - Avail: {avail.toLocaleString()} pkts ({ch.temperature}°C)
                  </option>
                );
              })}
            </select>
            {errors.chamberId && <p className="text-[11px] text-red-500 mt-1">{errors.chamberId}</p>}
          </div>
        </div>

        {/* Selected Chamber Capacity Indicator */}
        {selectedChamber && (
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <p className="font-bold text-slate-800">
                Selected Chamber: {selectedChamber.name} ({selectedChamber.chamberCode})
              </p>
              <p className="text-slate-500 text-[11px]">
                Atmosphere Temperature: <strong>{selectedChamber.temperature}°C</strong>
              </p>
            </div>
            <div className="flex items-center space-x-6 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Capacity:</span>
                <p className="font-bold text-slate-900">{selectedChamber.maxCapacity?.toLocaleString()} pkts</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Occupied:</span>
                <p className="font-bold text-slate-700">{selectedChamber.currentOccupancy?.toLocaleString()} pkts</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Available Buffer:</span>
                <p className="font-bold text-emerald-600">{availableSpace.toLocaleString()} pkts</p>
              </div>
            </div>
          </div>
        )}

        {/* Quantities & Tariffs */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Input
            label="Number of Packets / Bags *"
            name="quantity"
            type="number"
            value={formData.quantity}
            onChange={(e) => {
              setFormData({ ...formData, quantity: e.target.value });
              if (errors.quantity) setErrors({ ...errors, quantity: null });
            }}
            placeholder="e.g. 500"
            error={errors.quantity}
            required
          />

          <Input
            label="Weight per Packet (Kg)"
            name="weightPerPacket"
            type="number"
            value={formData.weightPerPacket}
            onChange={(e) => setFormData({ ...formData, weightPerPacket: e.target.value })}
            placeholder="e.g. 50"
          />

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex flex-col justify-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Weight (Calculated)</span>
            <p className="text-sm font-bold text-slate-900 mt-1">
              {(totalWeight || 0).toLocaleString()} kg ({((totalWeight || 0) / 100).toFixed(1)} Quintal)
            </p>
          </div>

          <Input
            label="Storage Tariff Rate (₹)"
            name="storageRate"
            type="number"
            value={formData.storageRate}
            onChange={(e) => setFormData({ ...formData, storageRate: e.target.value })}
            placeholder="e.g. 20"
          />
        </div>

        {/* Vehicle & Logistics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Input
            label="Vehicle Number"
            name="vehicleNumber"
            value={formData.vehicleNumber}
            onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value.toUpperCase() })}
            placeholder="e.g. UP-80-AT-1234"
          />

          <Input
            label="Driver Name"
            name="driverName"
            value={formData.driverName}
            onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
            placeholder="e.g. Ramesh Kumar"
          />

          <Select
            label="Quality Grade"
            name="qualityGrade"
            value={formData.qualityGrade}
            onChange={(e) => setFormData({ ...formData, qualityGrade: e.target.value })}
            options={[
              { value: 'Grade A', label: 'Grade A (Premium)' },
              { value: 'Grade B', label: 'Grade B (Standard)' },
              { value: 'Grade C', label: 'Grade C' },
            ]}
          />

          <Input
            label="Intake Date"
            name="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
        </div>

        <Input
          label="Remarks / Lot Description"
          name="remarks"
          value={formData.remarks}
          onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
          placeholder="e.g. Pre-cooled, clean jute bags, verified at weighbridge"
        />

        {/* Action Buttons (Requirement 6) */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFormData({
                customerId: '',
                commodityId: '',
                chamberId: '',
                quantity: '',
                weightPerPacket: 50,
                storageRate: '',
                rateType: 'per_month',
                vehicleNumber: '',
                driverName: '',
                qualityGrade: 'Grade A',
                remarks: '',
                date: new Date().toISOString().split('T')[0],
              });
              setSelectedChamber(null);
              setSelectedCommodity(null);
            }}
          >
            Clear Form
          </Button>

          <Button
            type="button"
            variant="secondary"
            loading={submitting}
            onClick={() => handleSave(false)}
          >
            Save Entry
          </Button>

          <Button
            type="button"
            variant="primary"
            loading={submitting}
            onClick={() => handleSave(true)}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Save & Print Receipt
          </Button>
        </div>
      </div>

      {/* Recent Inward Intake Entries Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-4 space-y-3">
        <h3 className="text-sm font-bold text-slate-800">Recent Inward Entries</h3>
        <Table
          columns={columns}
          data={entries}
          loading={loading}
          emptyMessage="No inward entries recorded yet"
        />
      </div>

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        data={receiptData}
        type="Storage Receipt"
      />

      {/* Customer Modal for Quick Adding */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSaved={loadData}
      />
    </div>
  );
};
