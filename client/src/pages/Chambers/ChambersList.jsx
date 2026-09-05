import React, { useState, useEffect } from 'react';
import {
  ThermometerSnowflake,
  Plus,
  Edit2,
  Trash2,
  Boxes,
  CheckCircle2,
  AlertTriangle,
  Flame,
} from 'lucide-react';
import { chamberService } from '../../services/chamberService';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Loader } from '../../components/common/Loader';
import { useToast } from '../../context/ToastContext';

export const ChambersList = () => {
  const [chambers, setChambers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedChamber, setSelectedChamber] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    chamberCode: '',
    maxCapacity: '',
    temperature: 2.0,
    status: 'Active',
    description: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, name: '' });

  const { success, error } = useToast();

  const fetchChambers = async () => {
    try {
      setLoading(true);
      const res = await chamberService.getAll();
      if (res.success) {
        setChambers(res.data);
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to fetch chambers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChambers();
  }, []);

  const handleOpenModal = (chamber = null) => {
    if (chamber) {
      setSelectedChamber(chamber);
      setFormData({
        name: chamber.name,
        chamberCode: chamber.chamberCode,
        maxCapacity: chamber.maxCapacity,
        temperature: chamber.temperature,
        status: chamber.status,
        description: chamber.description || '',
      });
    } else {
      setSelectedChamber(null);
      const nextCode = `CH-${String.fromCharCode(65 + chambers.length)}`;
      setFormData({
        name: `Chamber ${String.fromCharCode(65 + chambers.length)}`,
        chamberCode: nextCode,
        maxCapacity: 25000,
        temperature: 2.0,
        status: 'Active',
        description: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (selectedChamber) {
        await chamberService.update(selectedChamber.id || selectedChamber._id, formData);
        success('Chamber updated successfully');
      } else {
        await chamberService.create(formData);
        success('New chamber registered successfully');
      }
      setIsModalOpen(false);
      fetchChambers();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to save chamber');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await chamberService.delete(deleteConfirm.id);
      success(`Chamber ${deleteConfirm.name} deleted`);
      setDeleteConfirm({ isOpen: false, id: null, name: '' });
      fetchChambers();
    } catch (err) {
      error(err.response?.data?.message || 'Cannot delete chamber with active stored goods');
    }
  };

  const totalCap = chambers.reduce((s, c) => s + c.maxCapacity, 0);
  const totalOcc = chambers.reduce((s, c) => s + c.currentOccupancy, 0);
  const totalAvail = Math.max(0, totalCap - totalOcc);
  const overallPct = totalCap > 0 ? Math.round((totalOcc / totalCap) * 1000) / 10 : 0;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader message="Loading cold chambers and capacity sensors..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Cold Storage Chambers</h1>
          <p className="text-xs text-slate-500">
            Chamber atmosphere, temperature control, and live capacity management
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => handleOpenModal()}
          className="bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Chamber
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total Facility Capacity"
          value={`${totalCap.toLocaleString()} pkts`}
          subtitle="Combined storage volume"
          icon={ThermometerSnowflake}
          iconBg="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Currently Occupied"
          value={`${totalOcc.toLocaleString()} pkts`}
          subtitle={`${overallPct}% occupied`}
          icon={Boxes}
          iconBg="bg-cyan-50 text-cyan-600"
        />
        <StatCard
          title="Available Buffer"
          value={`${totalAvail.toLocaleString()} pkts`}
          subtitle="Free storage capacity"
          icon={CheckCircle2}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Active Chambers"
          value={chambers.filter((c) => c.status === 'Active').length}
          subtitle="Online & regulated"
          icon={CheckCircle2}
          iconBg="bg-purple-50 text-purple-600"
        />
      </div>

      {/* Chambers Visual Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {chambers.map((ch) => {
          const occPct = ch.maxCapacity > 0 ? Math.round((ch.currentOccupancy / ch.maxCapacity) * 100) : 0;
          return (
            <div
              key={ch.id || ch._id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4 hover:shadow-md transition"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                      {ch.chamberCode}
                    </span>
                    <Badge status={ch.status} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{ch.name}</h3>
                </div>

                {/* Temperature Gauge Pill */}
                <div className="flex items-center space-x-1.5 px-3 py-1 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm">
                  <ThermometerSnowflake className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{ch.temperature}°C</span>
                </div>
              </div>

              {ch.description && (
                <p className="text-xs text-slate-500 line-clamp-2">{ch.description}</p>
              )}

              {/* Progress Bar & Details */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600">Occupancy:</span>
                  <span className="text-slate-900">{occPct}%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      occPct >= 85 ? 'bg-amber-500' : 'bg-cyan-500'
                    }`}
                    style={{ width: `${Math.min(occPct, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                  <span>Occupied: <strong>{ch.currentOccupancy?.toLocaleString()}</strong></span>
                  <span>Max: <strong>{ch.maxCapacity?.toLocaleString()} pkts</strong></span>
                </div>
              </div>

              {/* Stat Grid */}
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl text-xs">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Available Space</p>
                  <p className="font-bold text-emerald-600 text-sm mt-0.5">
                    {Math.max(0, ch.maxCapacity - ch.currentOccupancy).toLocaleString()} pkts
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Active Lots</p>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">
                    {ch.activeLotsCount || 0} Batches
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-slate-100 flex justify-end space-x-2">
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => handleOpenModal(ch)}
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  Edit Chamber
                </Button>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => setDeleteConfirm({ isOpen: true, id: ch.id || ch._id, name: ch.name })}
                  className="text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Chamber Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedChamber ? 'Edit Chamber' : 'Register New Chamber'}
        subtitle="Configure chamber code, capacity limits, and operating temperature"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Chamber Name *"
              name="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Chamber A"
              required
            />

            <Input
              label="Chamber Code *"
              name="chamberCode"
              value={formData.chamberCode}
              onChange={(e) => setFormData({ ...formData, chamberCode: e.target.value.toUpperCase() })}
              placeholder="e.g. CH-A"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Max Capacity (Packets/Bags) *"
              name="maxCapacity"
              type="number"
              value={formData.maxCapacity}
              onChange={(e) => setFormData({ ...formData, maxCapacity: e.target.value })}
              placeholder="e.g. 30000"
              required
            />

            <Input
              label="Operating Temperature (°C) *"
              name="temperature"
              type="number"
              step="0.1"
              value={formData.temperature}
              onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
              placeholder="e.g. -2.5"
              required
            />
          </div>

          <Select
            label="Chamber Status"
            name="status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={[
              { value: 'Active', label: 'Active (Available for storage)' },
              { value: 'Full', label: 'Full' },
              { value: 'Maintenance', label: 'Maintenance / Service' },
              { value: 'Inactive', label: 'Inactive' },
            ]}
          />

          <Input
            label="Chamber Description / Specs"
            name="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="e.g. Sub-zero controlled atmosphere chamber for potatoes and roots"
          />

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={formLoading}>
              {selectedChamber ? 'Update Chamber' : 'Save Chamber'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null, name: '' })}
        onConfirm={handleDelete}
        title="Delete Cold Chamber"
        message={`Are you sure you want to delete ${deleteConfirm.name}? Note: Chambers storing active goods cannot be deleted.`}
        confirmText="Delete Chamber"
        variant="danger"
      />
    </div>
  );
};
