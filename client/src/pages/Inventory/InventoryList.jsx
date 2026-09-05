import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Boxes,
  Search,
  ArrowUpFromLine,
  Calendar,
  Filter,
  Eye,
  ArrowDownToLine,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { lotService } from '../../services/lotService';
import { customerService } from '../../services/customerService';
import { commodityService } from '../../services/commodityService';
import { chamberService } from '../../services/chamberService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Table } from '../../components/common/Table';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/common/Select';
import { StatCard } from '../../components/common/StatCard';
import { Pagination } from '../../components/common/Pagination';
import { useToast } from '../../context/ToastContext';

export const InventoryList = () => {
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [chamberFilter, setChamberFilter] = useState('All');
  const [commodityFilter, setCommodityFilter] = useState('All');
  const [customerFilter, setCustomerFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  // Filter lists
  const [customers, setCustomers] = useState([]);
  const [commodities, setCommodities] = useState([]);
  const [chambers, setChambers] = useState([]);

  const navigate = useNavigate();
  const { error } = useToast();

  const loadFilterData = async () => {
    try {
      const [custRes, commRes, chamRes] = await Promise.all([
        customerService.getAll({ limit: 100 }),
        commodityService.getAll(),
        chamberService.getAll(),
      ]);
      if (custRes.success) setCustomers(custRes.data);
      if (commRes.success) setCommodities(commRes.data);
      if (chamRes.success) setChambers(chamRes.data);
    } catch (e) {
      // silent
    }
  };

  const fetchLots = async () => {
    try {
      setLoading(true);
      const res = await lotService.getAll({
        search,
        status: statusFilter,
        chamber: chamberFilter,
        commodity: commodityFilter,
        customer: customerFilter,
        page,
        limit: 15,
      });
      if (res.success) {
        setLots(res.data);
        setPagination(res.pagination || { total: res.data.length, pages: 1 });
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to fetch inventory lots');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFilterData();
  }, []);

  useEffect(() => {
    fetchLots();
  }, [search, statusFilter, chamberFilter, commodityFilter, customerFilter, page]);

  // KPIs
  const totalStockInLots = lots.reduce((acc, l) => acc + (l.remainingQuantity || 0), 0);
  const storedLotsCount = lots.filter((l) => l.status === 'Stored').length;
  const partialLotsCount = lots.filter((l) => l.status === 'Partially Released').length;

  const columns = [
    {
      header: 'Lot Number',
      accessor: 'lotNumber',
      render: (l) => (
        <span className="font-mono text-xs font-bold text-cyan-700 bg-cyan-50 px-2.5 py-0.5 rounded border border-cyan-200">
          {l.lotNumber}
        </span>
      ),
    },
    {
      header: 'Customer / Farmer',
      accessor: 'customer',
      render: (l) => (
        <div>
          <p className="font-bold text-slate-900">{l.customer?.name}</p>
          <p className="text-[11px] text-slate-500">{l.customer?.mobile}</p>
        </div>
      ),
    },
    {
      header: 'Commodity',
      accessor: 'commodity',
      render: (l) => (
        <div>
          <p className="font-medium text-slate-800">{l.commodity?.name}</p>
          <p className="text-[11px] text-slate-400">Rate: ₹{l.storageRate}/{l.commodity?.unit}</p>
        </div>
      ),
    },
    {
      header: 'Chamber',
      accessor: 'chamber',
      render: (l) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
          {l.chamber?.name}
        </span>
      ),
    },
    {
      header: 'Entry Date',
      accessor: 'entryDate',
      render: (l) => <span className="text-slate-600 text-xs">{formatDate(l.entryDate)}</span>,
    },
    {
      header: 'Stock Quantities',
      accessor: 'remainingQuantity',
      render: (l) => (
        <div className="text-xs">
          <p className="font-bold text-slate-900">{l.remainingQuantity?.toLocaleString()} {l.commodity?.unit}s</p>
          <p className="text-[11px] text-slate-400">
            Orig: {l.originalQuantity} | Rel: {l.releasedQuantity}
          </p>
        </div>
      ),
    },
    {
      header: 'Storage Duration',
      render: (l) => (
        <div className="text-xs text-slate-600">
          <p className="font-semibold flex items-center">
            <Clock className="w-3 h-3 mr-1 text-slate-400" />
            {l.storageDays || 1} Days
          </p>
          <p className="text-[11px] text-slate-400">{l.storageMonths || 1} month(s)</p>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (l) => <Badge status={l.status} />,
    },
    {
      header: 'Actions',
      render: (l) => (
        <div className="flex items-center space-x-2">
          {l.remainingQuantity > 0 ? (
            <Button
              size="xs"
              variant="outline"
              onClick={() => navigate(`/stock-release?lotId=${l.id || l._id}`)}
              className="border-rose-200 text-rose-700 hover:bg-rose-50"
            >
              <ArrowUpFromLine className="w-3 h-3 mr-1" />
              Release
            </Button>
          ) : (
            <span className="text-[11px] text-slate-400 italic">Dispatched</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Live Cold Storage Inventory</h1>
          <p className="text-xs text-slate-500">
            Real-time batch & lot tracking, storage duration counters, and quick outward dispatch
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate('/stock-inward')}
          className="bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          <ArrowDownToLine className="w-4 h-4 mr-1.5" />
          Add Inward Stock
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total Active Batches"
          value={pagination.total || lots.length}
          subtitle="Lots currently in facility"
          icon={Boxes}
          iconBg="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Remaining Stock"
          value={`${totalStockInLots.toLocaleString()} pkts`}
          subtitle="In chambers"
          icon={Boxes}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Full Batches"
          value={storedLotsCount}
          subtitle="Zero outward dispatches"
          icon={CheckCircle2}
          iconBg="bg-cyan-50 text-cyan-600"
        />
        <StatCard
          title="Partially Dispatched"
          value={partialLotsCount}
          subtitle="Partial stock releases"
          icon={ArrowUpFromLine}
          iconBg="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Instant Filters Bar (Requirement 12) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {/* Instant Search */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Instant Search (Lot #, Farmer Name, Mobile, Commodity)..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition"
            />
          </div>

          {/* Chamber Filter */}
          <select
            value={chamberFilter}
            onChange={(e) => {
              setChamberFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs p-2 rounded-xl border border-slate-200 focus:border-cyan-500 outline-none bg-white"
          >
            <option value="All">All Chambers</option>
            {chambers.map((c) => (
              <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>
            ))}
          </select>

          {/* Commodity Filter */}
          <select
            value={commodityFilter}
            onChange={(e) => {
              setCommodityFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs p-2 rounded-xl border border-slate-200 focus:border-cyan-500 outline-none bg-white"
          >
            <option value="All">All Commodities</option>
            {commodities.map((comm) => (
              <option key={comm.id || comm._id} value={comm.id || comm._id}>{comm.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs p-2 rounded-xl border border-slate-200 focus:border-cyan-500 outline-none bg-white"
          >
            <option value="All">All Lot Statuses</option>
            <option value="Stored">Stored (Full)</option>
            <option value="Partially Released">Partially Released</option>
            <option value="Released">Released (Archived)</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <Table
          columns={columns}
          data={lots}
          loading={loading}
          emptyMessage="No stored inventory lots found"
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
    </div>
  );
};
