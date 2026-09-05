import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  ArrowDownToLine,
  ArrowUpFromLine,
  ThermometerSnowflake,
  Layers,
  Users,
  CreditCard,
  BookOpen,
  BarChart3,
  Settings,
  X,
  ShieldCheck,
  Snowflake,
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const navSections = [
    {
      title: 'Overview',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'Operations',
      items: [
        { name: 'Stock Inward', path: '/stock-inward', icon: ArrowDownToLine, badge: 'Inward' },
        { name: 'Inventory / Lots', path: '/inventory', icon: Boxes, badge: 'Stock' },
        { name: 'Stock Release', path: '/stock-release', icon: ArrowUpFromLine, badge: 'Outward' },
        { name: 'Chambers', path: '/chambers', icon: ThermometerSnowflake },
        { name: 'Commodities', path: '/commodities', icon: Layers },
        { name: 'Customers', path: '/customers', icon: Users },
      ],
    },
    {
      title: 'Finance & Accounts',
      items: [
        { name: 'Payments', path: '/payments', icon: CreditCard },
        { name: 'Customer Ledger', path: '/ledger', icon: BookOpen },
        { name: 'Reports', path: '/reports', icon: BarChart3 },
      ],
    },
    {
      title: 'Administration',
      items: [
        { name: 'Settings', path: '/settings', icon: Settings },
      ],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-cyan-900/30">
              <Snowflake className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight leading-tight">SmartCold</h1>
              <p className="text-[10px] text-cyan-400 font-semibold tracking-wider uppercase flex items-center">
                <ShieldCheck className="w-3 h-3 mr-1 inline" /> Storage Management
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navSections.map((section, idx) => (
            <div key={idx}>
              <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                {section.title}
              </p>
              <nav className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => {
                        if (window.innerWidth < 1024) onClose();
                      }}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                          isActive
                            ? 'bg-cyan-600 text-white font-semibold shadow-md shadow-cyan-900/20'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center space-x-3">
                            <Icon
                              className={`w-4 h-4 transition-colors ${
                                isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                              }`}
                            />
                            <span>{item.name}</span>
                          </div>
                          {item.badge && (
                            <span
                              className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                isActive
                                  ? 'bg-cyan-700/80 text-cyan-100'
                                  : 'bg-slate-800 text-cyan-400 border border-cyan-500/20'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
          <div className="bg-slate-850 rounded-xl p-3 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">Capacity: 90,000</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                69.4% Full
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Chambers A, B & C Online</p>
          </div>
        </div>
      </aside>
    </>
  );
};
