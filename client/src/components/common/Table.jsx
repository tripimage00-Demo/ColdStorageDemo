import React from 'react';
import { Loader2, Inbox } from 'lucide-react';

export const Table = ({
  columns = [],
  data = [],
  headers = [],
  children,
  loading = false,
  isLoading = false,
  isEmpty,
  emptyMessage = 'No records found.',
  emptyIcon: EmptyIcon = Inbox,
  className = '',
  rowKey = '_id',
  onRowClick,
}) => {
  const isTableLoading = loading || isLoading;
  const computedHeaders =
    columns.length > 0
      ? columns.map((col) => ({
          label: col.header || col.title || col.label || '',
          align: col.align || 'left',
          className: col.className || '',
        }))
      : headers.map((h) => (typeof h === 'string' ? { label: h, align: 'left' } : h));

  const numCols = Math.max(computedHeaders.length, 1);
  const isDataEmpty =
    isEmpty !== undefined ? isEmpty : !children && (!data || data.length === 0);

  return (
    <div className={`overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-sm ${className}`}>
      <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
        <thead className="bg-slate-50/90 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
          <tr>
            {computedHeaders.map((h, idx) => (
              <th
                key={idx}
                scope="col"
                className={`px-4 py-3.5 font-semibold ${
                  h.align === 'right'
                    ? 'text-right'
                    : h.align === 'center'
                    ? 'text-center'
                    : 'text-left'
                } ${h.className || ''}`}
              >
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {isTableLoading ? (
            <tr>
              <td colSpan={numCols} className="px-4 py-16 text-center text-slate-500">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <Loader2 className="w-7 h-7 animate-spin text-cyan-600" />
                  <span className="text-xs font-medium text-slate-600">Loading records...</span>
                </div>
              </td>
            </tr>
          ) : isDataEmpty ? (
            <tr>
              <td colSpan={numCols} className="px-4 py-14 text-center text-slate-400">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <EmptyIcon className="w-8 h-8 text-slate-300 stroke-[1.5]" />
                  <p className="text-xs font-medium text-slate-500">{emptyMessage}</p>
                </div>
              </td>
            </tr>
          ) : children ? (
            children
          ) : (
            data.map((item, rowIdx) => (
              <tr
                key={item[rowKey] || item.id || item._id || rowIdx}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
                className={`transition hover:bg-slate-50/70 ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {columns.map((col, colIdx) => {
                  let content = null;
                  if (typeof col.render === 'function') {
                    content = col.render(item, rowIdx);
                  } else if (col.accessor) {
                    content = item[col.accessor] ?? '-';
                  }

                  return (
                    <td
                      key={colIdx}
                      className={`px-4 py-3.5 text-slate-700 align-middle ${
                        col.align === 'right'
                          ? 'text-right'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left'
                      } ${col.className || ''}`}
                    >
                      {content}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
