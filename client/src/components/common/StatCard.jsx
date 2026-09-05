import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg = 'bg-emerald-500/10 text-emerald-600',
  trend,
  trendType = 'up',
  className = '',
}) => {
  return (
    <div className={`bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
        {Icon && (
          <div className={`p-2.5 rounded-xl ${iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
      </div>

      {(subtitle || trend) && (
        <div className="mt-2.5 flex items-center text-xs space-x-1.5">
          {trend && (
            <span
              className={`inline-flex items-center font-semibold ${
                trendType === 'up'
                  ? 'text-emerald-600'
                  : trendType === 'down'
                  ? 'text-rose-600'
                  : 'text-slate-500'
              }`}
            >
              {trendType === 'up' && <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />}
              {trendType === 'down' && <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
              {trend}
            </span>
          )}
          {subtitle && <span className="text-slate-500 truncate">{subtitle}</span>}
        </div>
      )}
    </div>
  );
};
