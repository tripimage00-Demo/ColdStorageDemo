import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  Phone,
  MapPin,
  Eye,
  Edit2,
  Trash2,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react';
import { customerService } from '../../services/customerService';
import { formatCurrency } from '../../utils/formatters';
import { Table } from '../../components/common/Table';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { StatCard } from '../../components/common/StatCard';
import { Pagination } from '../../components/common/Pagination';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { CustomerModal } from './CustomerModal';
import { useToast } from '../../context/ToastContext';

export const CustomersList = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, name: '' });

  const navigate = useNavigate();
  const { success, error } = useToast();

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await customerService.getAll({
        search,
        status: statusFilter,
        page,
        limit,
      });
      if (res.success) {
        setCustomers(res.data);
        setPagination(res.pagination || { total: res.data.length, pages: 1 });
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, statusFilter, page]);

  const handleDelete = async () => {
    try {
      await customerService.delete(deleteConfirm.id);
      success(`Customer ${deleteConfirm.name} deleted successfully`);
      setDeleteConfirm({ isOpen: false, id: null, name: '' });
      fetchCustomers();
    } catch (err) {
      error(err.response?.data?.message || 'Cannot delete customer');
    }
  };

  // KPIs
  const totalOutstanding = customers.reduce((sum, c) => sum + (c.outstandingBalance || 0), 0);
  const customersWithDues = customers.filter((c) => (c.outstandingBalance || 0) > 0).length;

  const columns = [
    {
      header: 'Customer ID',
      accessor: 'customerId',
      render: (c) => (
        <span className="font-mono text-xs font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
          {c.customerId || 'CUST-XXXX'}
        </span>
      ),
    },
    {
      header: 'Customer / Farmer',
      accessor: 'name',
      render: (c) => (
        <div>
          <p className="font-bold text-slate-900">{c.name}</p>
          <div className="flex items-center text-[11px] text-slate-500 mt-0.5">
            <Phone className="w-3 h-3 mr-1 text-slate-400" />
            {c.mobile}
            {c.altMobile && <span className="ml-1 text-slate-400">/ {c.altMobile}</span>}
          </div>
        </div>
      ),
    },
    {
      header: 'Location / Mandi',
      accessor: 'village',
      render: (c) => (
        <div className="text-xs text-slate-600">
          <p className="font-medium">{c.village || c.address || '—'}</p>
          <p className="text-[11px] text-slate-400">{c.district}, {c.state}</p>
        </div>
      ),
    },
    {
      header: 'Outstanding Dues',
      accessor: 'outstandingBalance',
      render: (c) => (
        <span
          className={`font-bold text-xs ${
            c.outstandingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'
          }`}
        >
          {formatCurrency(c.outstandingBalance || 0)}
        </span>
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
            onClick={() => navigate(`/customers/${c.id || c._id}`)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-700 hover:bg-cyan-50 transition"
            title="View Full Customer Profile"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedCustomer(c);
              setIsModalOpen(true);
            }}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
            title="Edit Customer"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteConfirm({ isOpen: true, id: c.id || c._id, name: c.name })}
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
            title="Delete Customer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Customer Management</h1>
          <p className="text-xs text-slate-500">
            Registered farmers, Mandi traders, stock accounts, and outstanding balances
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setSelectedCustomer(null);
            setIsModalOpen(true);
          }}
          className="bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Customer
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total Customers"
          value={pagination.total || customers.length}
          subtitle="Registered accounts"
          icon={Users}
          iconBg="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Active Status"
          value={customers.filter((c) => c.status === 'Active').length}
          subtitle="Ready for stock operations"
          icon={CheckCircle2}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Pending Due Accounts"
          value={customersWithDues}
          subtitle="Customers with balance"
          icon={AlertTriangle}
          iconBg="bg-amber-50 text-amber-600"
        />
        <StatCard
          title="Total Outstanding"
          value={formatCurrency(totalOutstanding)}
          subtitle="Storage dues payable"
          icon={AlertTriangle}
          iconBg="bg-rose-50 text-rose-600"
        />
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Name, Mobile, Village, ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition"
          />
        </div>

        <div className="flex items-center space-x-3">
          <Select
            label=""
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: 'All', label: 'All Statuses' },
              { value: 'Active', label: 'Active Only' },
              { value: 'Inactive', label: 'Inactive' },
            ]}
            className="w-40 text-xs py-2"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <Table
          columns={columns}
          data={customers}
          loading={loading}
          emptyMessage="No customers found matching the search criteria"
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

      {/* Add / Edit Modal */}
      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customer={selectedCustomer}
        onSaved={fetchCustomers}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null, name: '' })}
        onConfirm={handleDelete}
        title="Delete Customer Account"
        message={`Are you sure you want to delete customer "${deleteConfirm.name}"? Note: Customers with active stored lots cannot be removed.`}
        confirmText="Yes, Delete"
        variant="danger"
      />
    </div>
  );
};
