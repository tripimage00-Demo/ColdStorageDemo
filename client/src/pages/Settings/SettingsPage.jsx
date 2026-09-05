import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Building,
  Save,
  CheckCircle2,
  FileText,
  Mail,
  Phone,
  MapPin,
  IndianRupee,
  ShieldCheck,
  Snowflake,
} from 'lucide-react';
import { settingsService } from '../../services/settingsService';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Loader } from '../../components/common/Loader';
import { useToast } from '../../context/ToastContext';

export const SettingsPage = () => {
  const [formData, setFormData] = useState({
    companyName: 'SmartCold Storage Management',
    tagline: 'Simple Storage. Better Control.',
    ownerName: 'Rajesh Agarwal',
    address: 'NH-19 Agra Highway Bypass, Sikandra, Agra, Uttar Pradesh - 282007',
    phone: '+91 98765 43210',
    email: 'contact@smartcold.com',
    gstNumber: '09AAACS1234F1Z5',
    defaultStorageRate: 20,
    currency: '₹',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { success, error } = useToast();

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await settingsService.get();
      if (res.success && res.data) {
        setFormData({
          companyName: res.data.companyName || '',
          tagline: res.data.tagline || '',
          ownerName: res.data.ownerName || '',
          address: res.data.address || '',
          phone: res.data.phone || '',
          email: res.data.email || '',
          gstNumber: res.data.gstNumber || '',
          defaultStorageRate: res.data.defaultStorageRate || 20,
          currency: res.data.currency || '₹',
        });
      }
    } catch (err) {
      error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await settingsService.update(formData);
      success('Company profile & receipt settings saved successfully');
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader message="Loading settings..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Company Profile & Storage Settings</h1>
        <p className="text-xs text-slate-500">
          Facility identification, receipt headers, default tariff rates, and tax registration details
        </p>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
        {/* Brand Banner */}
        <div className="flex items-center space-x-4 p-4 rounded-xl bg-slate-900 text-white">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center shadow-md">
            <Snowflake className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-base font-black tracking-tight">{formData.companyName}</h2>
            <p className="text-xs text-cyan-400 font-semibold">{formData.tagline}</p>
          </div>
        </div>

        {/* Basic Facility Info */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            1. Business Identification
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Cold Storage Name *"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              placeholder="e.g. SmartCold Storage Management"
              required
            />

            <Input
              label="Tagline / Motto"
              name="tagline"
              value={formData.tagline}
              onChange={handleChange}
              placeholder="e.g. Simple Storage. Better Control."
            />

            <Input
              label="Proprietor / Managing Director"
              name="ownerName"
              value={formData.ownerName}
              onChange={handleChange}
              placeholder="e.g. Rajesh Agarwal"
            />

            <Input
              label="GSTIN Number *"
              name="gstNumber"
              value={formData.gstNumber}
              onChange={handleChange}
              placeholder="e.g. 09AAACS1234F1Z5"
              required
            />
          </div>
        </div>

        {/* Contact & Address */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            2. Facility Contact & Location (Printed on Invoices & Receipts)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Official Phone / Mobile *"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="e.g. +91 98765 43210"
              required
            />

            <Input
              label="Official Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. contact@smartcold.com"
            />
          </div>

          <Input
            label="Full Physical Address (Printed on Receipts) *"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="e.g. NH-19 Agra Highway Bypass, Sikandra, Agra, Uttar Pradesh - 282007"
            required
          />
        </div>

        {/* Storage Defaults */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            3. Tariff & Currency Defaults
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Default Base Storage Rate (₹ per bag/pkt)"
              name="defaultStorageRate"
              type="number"
              value={formData.defaultStorageRate}
              onChange={handleChange}
              placeholder="e.g. 20"
            />

            <Input
              label="System Currency Symbol"
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              placeholder="e.g. ₹"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-slate-100">
          <Button
            type="submit"
            variant="primary"
            loading={saving}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            <Save className="w-4 h-4 mr-1.5" />
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
};
