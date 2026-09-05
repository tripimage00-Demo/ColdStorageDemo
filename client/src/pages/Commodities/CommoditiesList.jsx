import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  Tag,
  IndianRupee,
} from 'lucide-react';
import { commodityService } from '../../services/commodityService';
import { formatCurrency } from '../../utils/formatters';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import { Table } from '../../components/common/Table';
import { Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useToast } from '../../context/ToastContext';

export const CommoditiesList = () => {
  const [commodities, setCommodities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCommodity, setSelectedCommodity] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    storageRate: '',
    rateType: 'per_month',
    unit: 'Bag',
    description: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, name: '' });

  const { success, error } = useToast();

  const fetchCommodities = async () => {
    try {
      setLoading(true);
      const res = await commodityService.getAll({ search });
      if (res.success) {
        setCommodities(res.data);
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to fetch commodities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommodities();
  }, [search]);

  const handleOpenModal = (commodity = null) => {
    if (commodity) {
      setSelectedCommodity(commodity);
      setFormData({
        name: commodity.name,
        code: commodity.code,
        storageRate: commodity.storageRate,
        rateType: commodity.rateType,
        unit: commodity.unit,
        description: commodity.description || '',
      });
    } else {
      setSelectedCommodity(null);
      setFormData({
        name: '',
        code: `COMM-${String(commodities.length + 1).padStart(2, '0')}`,
        storageRate: 20,
        rateType: 'per_month',
        unit: 'Bag',
        description: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (selectedCommodity) {
        await commodityService.update(selectedCommodity.id || selectedCommodity._id, formData);
        success('Commodity updated successfully');
      } else {
        await commodityService.create(formData);
        success('New commodity added to catalogue');
      }
      setIsModalOpen(false);
      fetchCommodities();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to save commodity');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await commodityService.delete(deleteConfirm.id);
      success(`Commodity ${deleteConfirm.name} deleted`);
      setDeleteConfirm({ isOpen: false, id: null, name: '' });
      fetchCommodities();
    } catch (err) {
      error(err.response?.data?.message || 'Cannot delete commodity with stored lots');
    }
  };

  const columns = [
    {
      header: 'Commodity Code',
      accessor: 'code',
      render: (c) => (
        <span className="font-mono text-xs font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
          {c.code}
        </span>
      ),
    },
    {
      header: 'Commodity Name',
      accessor: 'name',
      render: (c) => (
        <div>
          <p className="font-bold text-slate-900">{c.name}</p>
          <p className="text-[11px] text-slate-500">{c.description || 'Standard cold stored goods'}</p>
        </div>
      ),
    },
    {
      header: 'Packaging Unit',
      accessor: 'unit',
      render: (c) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
          {c.unit}
        </span>
      ),
    },
    {
      header: 'Storage Tariff Rate',
      accessor: 'storageRate',
      render: (c) => (
        <div>
          <p className="font-bold text-slate-900 text-xs">₹{c.storageRate} / {c.unit}</p>
          <span className="text-[10px] font-semibold uppercase text-cyan-700">
            {c.rateType.replace('_', ' ')}
          </span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (c) => <Badge status={c.status} />,
    },
    {
      header: 'Actions',
      render: (c) => (
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => handleOpenModal(c)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
            title="Edit Commodity"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteConfirm({ isOpen: true, id: c.id || c._id, name: c.name })}
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
            title="Delete Commodity"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Commodities & Storage Rates</h1>
          <p className="text-xs text-slate-500">
            Agricultural produce types, standard units, packaging, and tariff rate structures
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => handleOpenModal()}
          className="bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Commodity
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Registered Commodities"
          value={commodities.length}
          subtitle="Agri produce varieties"
          icon={Layers}
          iconBg="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Active Catalogue"
          value={commodities.filter((c) => c.status === 'Active').length}
          subtitle="Permitted for inward intake"
          icon={CheckCircle2}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Average Rate"
          value={`₹${Math.round(commodities.reduce((s, c) => s + c.storageRate, 0) / (commodities.length || 1))}`}
          subtitle="Per standard packaging unit"
          icon={IndianRupee}
          iconBg="bg-purple-50 text-purple-600"
        />
        <StatCard
          title="Pricing Schemes"
          value="5 Types"
          subtitle="Packet, Month, Season, Day"
          icon={Tag}
          iconBg="bg-cyan-50 text-cyan-600"
        />
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search commodity name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <Table
          columns={columns}
          data={commodities}
          loading={loading}
          emptyMessage="No commodities found matching search"
        />
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedCommodity ? 'Edit Commodity' : 'Add New Commodity'}
        subtitle="Specify produce name, storage rate, and measurement units"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Commodity Name *"
              name="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Potato, Onion, Apple"
              required
            />

            <Input
              label="Commodity Code *"
              name="code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g. COMM-POT-01"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Storage Rate (₹) *"
              name="storageRate"
              type="number"
              value={formData.storageRate}
              onChange={(e) => setFormData({ ...formData, storageRate: e.target.value })}
              placeholder="e.g. 20"
              required
            />

            <Select
              label="Rate Scheme"
              name="rateType"
              value={formData.rateType}
              onChange={(e) => setFormData({ ...formData, rateType: e.target.value })}
              options={[
                { value: 'per_month', label: 'Per Month' },
                { value: 'per_season', label: 'Per Season (Fixed)' },
                { value: 'per_bag', label: 'Per Bag' },
                { value: 'per_packet', label: 'Per Packet' },
                { value: 'per_day', label: 'Per Day' },
              ]}
            />

            <Select
              label="Unit of Measure"
              name="unit"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              options={[
                { value: 'Bag', label: 'Bag' },
                { value: 'Packet', label: 'Packet' },
                { value: 'Crate', label: 'Crate' },
                { value: 'Box', label: 'Box' },
                { value: 'Kg', label: 'Kg' },
                { value: 'Quintal', label: 'Quintal' },
                { value: 'Ton', label: 'Ton' },
              ]}
            />
          </div>

          <Input
            label="Description / Storage Guidelines"
            name="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="e.g. Standard 50kg jute bags; maintain 2°C temperature"
          />

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={formLoading}>
              {selectedCommodity ? 'Update Commodity' : 'Save Commodity'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null, name: '' })}
        onConfirm={handleDelete}
        title="Delete Commodity"
        message={`Are you sure you want to delete ${deleteConfirm.name}? Note: Commodities currently stored in active lots cannot be removed.`}
        confirmText="Delete Commodity"
        variant="danger"
      />
    </div>
  );
};
