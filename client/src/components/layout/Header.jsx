import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  LogOut,
  User,
  Shield,
  ChevronDown,
  Search,
  X,
  Boxes,
  Users,
  ArrowDownToLine,
  ArrowUpFromLine,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { searchService } from '../../services/searchService';
import { dashboardService } from '../../services/dashboardService';

export const Header = ({ onMenuClick, title = 'Dashboard' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [alerts, setAlerts] = useState([]);

  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch alerts for header
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await dashboardService.getStats();
        if (res.success && res.data?.alerts) {
          setAlerts(res.data.alerts);
        }
      } catch (e) {
        // silent
      }
    };
    fetchAlerts();
  }, []);

  // Global search debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchService.globalSearch(searchQuery);
        if (res.success) {
          setSearchResults(res.data);
          setSearchOpen(true);
        }
      } catch (e) {
        console.error('Search error:', e);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Hamburger & Title */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h2>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div className="hidden md:flex flex-1 max-w-md mx-6 relative" ref={searchRef}>
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Quick Search (Customer, Lot #, Receipt #)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.trim() && setSearchOpen(true)}
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-slate-800 rounded-xl border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchResults(null);
                setSearchOpen(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {searchOpen && searchResults && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 max-h-96 overflow-y-auto">
            <div className="px-4 pb-2 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Search Results
            </div>

            {/* Customers */}
            {searchResults.customers?.length > 0 && (
              <div className="py-2">
                <p className="px-4 text-[10px] font-bold text-slate-400 uppercase">Customers</p>
                {searchResults.customers.map((c) => (
                  <div
                    key={c.id || c._id}
                    onClick={() => {
                      setSearchOpen(false);
                      navigate(`/customers/${c.id || c._id}`);
                    }}
                    className="px-4 py-2 hover:bg-cyan-50/60 cursor-pointer flex items-center justify-between text-xs transition"
                  >
                    <div className="flex items-center space-x-2">
                      <Users className="w-3.5 h-3.5 text-cyan-600" />
                      <div>
                        <p className="font-semibold text-slate-800">{c.name}</p>
                        <p className="text-[11px] text-slate-500">{c.mobile} • {c.village || c.district}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded">
                      {c.customerId}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Lots */}
            {searchResults.lots?.length > 0 && (
              <div className="py-2 border-t border-slate-100">
                <p className="px-4 text-[10px] font-bold text-slate-400 uppercase">Active Lots</p>
                {searchResults.lots.map((l) => (
                  <div
                    key={l.id || l._id}
                    onClick={() => {
                      setSearchOpen(false);
                      navigate(`/inventory`);
                    }}
                    className="px-4 py-2 hover:bg-emerald-50/60 cursor-pointer flex items-center justify-between text-xs transition"
                  >
                    <div className="flex items-center space-x-2">
                      <Boxes className="w-3.5 h-3.5 text-emerald-600" />
                      <div>
                        <p className="font-semibold text-slate-800">{l.lotNumber} ({l.commodity?.name})</p>
                        <p className="text-[11px] text-slate-500">{l.customer?.name} • {l.chamber?.name}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700">
                      {l.remainingQuantity} pkts
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Inward Entries */}
            {searchResults.entries?.length > 0 && (
              <div className="py-2 border-t border-slate-100">
                <p className="px-4 text-[10px] font-bold text-slate-400 uppercase">Inward Entries</p>
                {searchResults.entries.map((e) => (
                  <div
                    key={e.id || e._id}
                    onClick={() => {
                      setSearchOpen(false);
                      navigate(`/stock-inward`);
                    }}
                    className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex items-center justify-between text-xs transition"
                  >
                    <div className="flex items-center space-x-2">
                      <ArrowDownToLine className="w-3.5 h-3.5 text-cyan-600" />
                      <div>
                        <p className="font-semibold text-slate-800">{e.entryNumber} - {e.commodity?.name}</p>
                        <p className="text-[11px] text-slate-500">Receipt: {e.receiptNumber}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-700">{e.quantity} pkts</span>
                  </div>
                ))}
              </div>
            )}

            {/* Releases */}
            {searchResults.releases?.length > 0 && (
              <div className="py-2 border-t border-slate-100">
                <p className="px-4 text-[10px] font-bold text-slate-400 uppercase">Stock Releases</p>
                {searchResults.releases.map((r) => (
                  <div
                    key={r.id || r._id}
                    onClick={() => {
                      setSearchOpen(false);
                      navigate(`/stock-release`);
                    }}
                    className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex items-center justify-between text-xs transition"
                  >
                    <div className="flex items-center space-x-2">
                      <ArrowUpFromLine className="w-3.5 h-3.5 text-rose-600" />
                      <div>
                        <p className="font-semibold text-slate-800">{r.releaseNumber} - {r.customer?.name}</p>
                        <p className="text-[11px] text-slate-500">Receipt: {r.receiptNumber}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-rose-700">-{r.releaseQuantity} pkts</span>
                  </div>
                ))}
              </div>
            )}

            {!searchResults.customers?.length &&
              !searchResults.lots?.length &&
              !searchResults.entries?.length &&
              !searchResults.releases?.length && (
                <div className="p-4 text-center text-xs text-slate-500">
                  No matching records found for "{searchQuery}"
                </div>
              )}
          </div>
        )}
      </div>

      {/* Right: Alerts & User Profile */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Alerts Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <Bell className="w-5 h-5" />
            {alerts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-white animate-pulse" />
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Cold Storage Alerts</span>
                <span className="text-[10px] bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded-full font-semibold">
                  {alerts.length} Active
                </span>
              </div>
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto text-xs">
                {alerts.length > 0 ? (
                  alerts.map((al, idx) => (
                    <div key={idx} className="p-3 hover:bg-slate-50 transition cursor-pointer">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-slate-800">{al.title}</p>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            al.type === 'warning'
                              ? 'bg-amber-100 text-amber-800'
                              : al.type === 'error'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-cyan-100 text-cyan-800'
                          }`}
                        >
                          {al.type}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5">{al.message}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-slate-500">
                    All storage conditions and balances optimal.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition border border-transparent hover:border-slate-200"
          >
            <div className="w-8 h-8 rounded-lg bg-cyan-700 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-800 leading-none">{user?.name || 'Administrator'}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{user?.email || 'admin@coldstorage.com'}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-800">{user?.name || 'Cold Storage Admin'}</p>
                <p className="text-[11px] text-slate-500">{user?.email || 'admin@coldstorage.com'}</p>
                <div className="mt-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-50 text-cyan-700">
                  <Shield className="w-3 h-3 mr-1" /> {user?.role || 'ADMIN'}
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full flex items-center px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  <User className="w-4 h-4 mr-2.5 text-slate-400" />
                  Storage Settings
                </button>
              </div>

              <div className="pt-1 border-t border-slate-100">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                >
                  <LogOut className="w-4 h-4 mr-2.5" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
