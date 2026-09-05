import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import { customerService } from '../../services/customerService';
import { useToast } from '../../context/ToastContext';

export const CustomerModal = ({ isOpen, onClose, onSaved, customer = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    altMobile: '',
    address: '',
    village: '',
    district: '',
    state: 'Uttar Pradesh',
    gstNumber: '',
    notes: '',
    status: 'Active',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { success, error } = useToast();

  useEffect(() => {
    if (isOpen) {
      if (customer) {
        setFormData({
          name: customer.name || '',
          mobile: customer.mobile || '',
          altMobile: customer.altMobile || '',
          address: customer.address || '',
          village: customer.village || '',
          district: customer.district || '',
          state: customer.state || 'Uttar Pradesh',
          gstNumber: customer.gstNumber || '',
          notes: customer.notes || '',
          status: customer.status || 'Active',
        });
      } else {
        setFormData({
          name: '',
          mobile: '',
          altMobile: '',
          address: '',
          village: '',
          district: '',
          state: 'Uttar Pradesh',
          gstNumber: '',
          notes: '',
          status: 'Active',
        });
      }
      setErrors({});
    }
  }, [isOpen, customer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Customer name is required';
    if (!formData.mobile.trim()) newErrors.mobile = 'Mobile number is required';
    else if (!/^\d{10}$/.test(formData.mobile.replace(/\D/g, ''))) {
      newErrors.mobile = 'Enter a valid 10-digit mobile number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      if (customer?.id || customer?._id) {
        await customerService.update(customer.id || customer._id, formData);
        success('Customer details updated successfully');
      } else {
        await customerService.create(formData);
        success('New customer registered successfully');
      }
      onSaved();
      onClose();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={customer ? 'Edit Customer' : 'Add New Customer / Farmer'}
      subtitle="Register cold storage customer details and contact information"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Customer / Farmer Name *"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Rajesh Kumar"
            error={errors.name}
            required
          />

          <Input
            label="Primary Mobile Number *"
            name="mobile"
            value={formData.mobile}
            onChange={handleChange}
            placeholder="e.g. 9876543210"
            error={errors.mobile}
            required
          />

          <Input
            label="Alternate Mobile Number"
            name="altMobile"
            value={formData.altMobile}
            onChange={handleChange}
            placeholder="e.g. 9876500000"
          />

          <Input
            label="GSTIN (Optional)"
            name="gstNumber"
            value={formData.gstNumber}
            onChange={handleChange}
            placeholder="e.g. 09AAKPR1122D1Z3"
          />

          <Input
            label="Village / Town"
            name="village"
            value={formData.village}
            onChange={handleChange}
            placeholder="e.g. Khandari"
          />

          <Input
            label="District"
            name="district"
            value={formData.district}
            onChange={handleChange}
            placeholder="e.g. Agra"
          />

          <Input
            label="State"
            name="state"
            value={formData.state}
            onChange={handleChange}
            placeholder="e.g. Uttar Pradesh"
          />

          <Select
            label="Account Status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            options={[
              { value: 'Active', label: 'Active (Permitted to store/release)' },
              { value: 'Inactive', label: 'Inactive' },
            ]}
          />
        </div>

        <Input
          label="Detailed Address / Mandi Shop"
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="e.g. Shop 14, Mandi Samiti Complex, GT Road"
        />

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Internal Notes / Contract Details
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={2}
            placeholder="e.g. Seasonal potato agreement; requires weekly reports"
            className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {customer ? 'Update Customer' : 'Save Customer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
