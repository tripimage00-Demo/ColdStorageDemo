import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import { paymentService } from '../../services/paymentService';
import { customerService } from '../../services/customerService';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';

export const PaymentModal = ({ isOpen, onClose, onSaved, onReceiptOpen = null }) => {
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({
    customerId: '',
    amount: '',
    paymentMethod: 'Cash',
    referenceNumber: '',
    remarks: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { success, error } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
      setFormData({
        customerId: '',
        amount: '',
        paymentMethod: 'Cash',
        referenceNumber: '',
        remarks: '',
        date: new Date().toISOString().split('T')[0],
      });
      setSelectedCustomer(null);
      setErrors({});
    }
  }, [isOpen]);

  const fetchCustomers = async () => {
    try {
      const res = await customerService.getAll({ limit: 100 });
      if (res.success) {
        setCustomers(res.data);
      }
    } catch (e) {
      console.error('Failed to load customers:', e);
    }
  };

  const handleCustomerChange = (e) => {
    const custId = e.target.value;
    const cust = customers.find((c) => (c.id || c._id) === custId);
    setSelectedCustomer(cust || null);
    setFormData((prev) => ({ ...prev, customerId: custId }));
    if (errors.customerId) setErrors((prev) => ({ ...prev, customerId: null }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.customerId) newErrors.customerId = 'Select a customer';
    if (!formData.amount || Number(formData.amount) <= 0) {
      newErrors.amount = 'Enter a valid payment amount';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await paymentService.create(formData);
      success('Payment recorded and credited to customer ledger successfully');
      onSaved();
      onClose();

      if (onReceiptOpen && res.data?.receipt) {
        onReceiptOpen(res.data.receipt);
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Customer Payment"
      subtitle="Collect payment against storage dues and update ledger balance"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Select Customer *
          </label>
          <select
            name="customerId"
            value={formData.customerId}
            onChange={handleCustomerChange}
            className={`w-full text-xs p-3 rounded-xl border ${
              errors.customerId ? 'border-red-500' : 'border-slate-200'
            } focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition bg-white`}
          >
            <option value="">-- Choose Customer / Farmer --</option>
            {customers.map((c) => (
              <option key={c.id || c._id} value={c.id || c._id}>
                {c.name} ({c.mobile}) - Outstanding: ₹{(c.outstandingBalance || 0).toLocaleString()}
              </option>
            ))}
          </select>
          {errors.customerId && <p className="text-[11px] text-red-500 mt-1">{errors.customerId}</p>}
        </div>

        {selectedCustomer && (
          <div className="p-3 bg-cyan-50/70 border border-cyan-200 rounded-xl flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-slate-900">{selectedCustomer.name}</p>
              <p className="text-slate-500 text-[11px]">{selectedCustomer.village}, {selectedCustomer.district}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400">Current Dues:</span>
              <p className="text-sm font-bold text-rose-600">{formatCurrency(selectedCustomer.outstandingBalance || 0)}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Payment Amount (₹) *"
            name="amount"
            type="number"
            value={formData.amount}
            onChange={handleChange}
            placeholder="e.g. 15000"
            error={errors.amount}
            required
          />

          <Select
            label="Payment Method"
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleChange}
            options={[
              { value: 'Cash', label: 'Cash' },
              { value: 'UPI', label: 'UPI / QR Code' },
              { value: 'Bank Transfer', label: 'Bank Transfer (NEFT/RTGS)' },
              { value: 'Cheque', label: 'Cheque' },
              { value: 'Other', label: 'Other' },
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Reference / Cheque / UTR #"
            name="referenceNumber"
            value={formData.referenceNumber}
            onChange={handleChange}
            placeholder="e.g. UPI/628192839211"
          />

          <Input
            label="Payment Date"
            name="date"
            type="date"
            value={formData.date}
            onChange={handleChange}
          />
        </div>

        <Input
          label="Remarks / Note"
          name="remarks"
          value={formData.remarks}
          onChange={handleChange}
          placeholder="e.g. Seasonal deposit advance"
        />

        <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Save & Update Balance
          </Button>
        </div>
      </form>
    </Modal>
  );
};
