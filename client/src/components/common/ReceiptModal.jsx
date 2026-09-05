import React, { useRef } from 'react';
import { X, Printer, Download, CheckCircle2, Snowflake } from 'lucide-react';
import { Button } from './Button';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const ReceiptModal = ({ isOpen, onClose, data, type = 'Storage Receipt' }) => {
  const receiptRef = useRef(null);

  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  const company = data.company || {
    companyName: 'SmartCold Storage Management',
    tagline: 'Simple Storage. Better Control.',
    address: 'NH-19 Agra Highway Bypass, Sikandra, Agra, Uttar Pradesh - 282007',
    phone: '+91 98765 43210',
    email: 'contact@smartcold.com',
    gstNumber: '09AAACS1234F1Z5',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      {/* Container */}
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8 print:m-0 print:border-none print:shadow-none">
        {/* Modal Actions Bar (Hidden on print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 print:hidden">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-full border border-cyan-200">
              {type}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Ref: {data.receiptNumber || data.paymentNumber || data.entryNumber || 'RCP-2026-0000'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-1.5" />
              Print Receipt
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper */}
        <div ref={receiptRef} className="p-8 sm:p-10 text-slate-800 bg-white" id="printable-receipt">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-md">
                <Snowflake className="w-7 h-7 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900">{company.companyName}</h1>
                <p className="text-xs font-semibold text-cyan-700">{company.tagline}</p>
                <p className="text-[11px] text-slate-500 max-w-sm mt-1">{company.address}</p>
                <div className="flex items-center space-x-3 text-[11px] text-slate-600 mt-1">
                  <span>Tel: {company.phone}</span>
                  <span>•</span>
                  <span>GSTIN: <strong>{company.gstNumber}</strong></span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-block bg-slate-900 text-white text-xs font-black px-3 py-1 rounded uppercase tracking-wider">
                {type}
              </div>
              <p className="text-xs font-bold text-slate-900 mt-2">
                #{data.receiptNumber || data.paymentNumber || data.entryNumber}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Date: {formatDate(data.date || data.releaseDate || new Date())}
              </p>
            </div>
          </div>

          {/* Customer & Lot Details Grid */}
          <div className="grid grid-cols-2 gap-6 my-6 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
            <div>
              <p className="font-bold uppercase tracking-wider text-slate-400 text-[10px] mb-1">Customer Details</p>
              <p className="font-bold text-sm text-slate-900">{data.customer?.name || 'Customer'}</p>
              <p className="text-slate-600 mt-0.5">ID: {data.customer?.customerId || 'CUST-XXXX'}</p>
              <p className="text-slate-600">Mobile: {data.customer?.mobile || 'N/A'}</p>
              {data.customer?.village && (
                <p className="text-slate-500 text-[11px]">{data.customer.village}, {data.customer.district}</p>
              )}
            </div>
            <div className="border-l border-slate-200/80 pl-6">
              <p className="font-bold uppercase tracking-wider text-slate-400 text-[10px] mb-1">Storage Location & Lot</p>
              <p className="font-bold text-slate-900">Lot Number: {data.lotNumber || 'N/A'}</p>
              <p className="text-slate-600 mt-0.5">Chamber: {data.chamber?.name || 'Chamber A'}</p>
              <p className="text-slate-600">Commodity: {data.commodity?.name || 'Agri Produce'}</p>
              {data.vehicleNumber && (
                <p className="text-slate-500 text-[11px]">Vehicle: {data.vehicleNumber}</p>
              )}
            </div>
          </div>

          {/* Itemized Table */}
          <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden my-6">
            <thead className="bg-slate-900 text-white font-semibold">
              <tr>
                <th className="p-3">Description</th>
                <th className="p-3 text-center">Unit</th>
                <th className="p-3 text-right">Quantity</th>
                <th className="p-3 text-right">Rate</th>
                <th className="p-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="p-3 font-medium">
                  {data.commodity?.name || 'Goods Stored'}
                  {data.qualityGrade && <span className="text-slate-500 ml-1">({data.qualityGrade})</span>}
                  {data.storageDays && (
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Storage Duration: {data.storageDays} days ({data.storageMonths} month(s))
                    </p>
                  )}
                </td>
                <td className="p-3 text-center text-slate-600">{data.commodity?.unit || 'Bag/Pkt'}</td>
                <td className="p-3 text-right font-bold">
                  {data.quantity || data.releaseQuantity || data.amount || 0}
                </td>
                <td className="p-3 text-right text-slate-600">
                  {data.storageRate ? `₹${data.storageRate}` : '—'}
                </td>
                <td className="p-3 text-right font-bold text-slate-900">
                  {formatCurrency(data.storageCharges || data.amount || 0)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Financial Summary */}
          <div className="flex justify-end my-4">
            <div className="w-64 space-y-2 text-xs">
              {(data.storageCharges !== undefined) && (
                <div className="flex justify-between text-slate-600">
                  <span>Storage Charges:</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(data.storageCharges)}</span>
                </div>
              )}
              {data.previousBalance !== undefined && (
                <div className="flex justify-between text-slate-600">
                  <span>Previous Dues:</span>
                  <span>{formatCurrency(data.previousBalance)}</span>
                </div>
              )}
              {(data.paymentReceived !== undefined || data.amount !== undefined) && (
                <div className="flex justify-between text-emerald-700 font-semibold border-t border-slate-200 pt-1.5">
                  <span>Amount Paid:</span>
                  <span>{formatCurrency(data.paymentReceived ?? data.amount ?? 0)}</span>
                </div>
              )}
              {(data.remainingBalance !== undefined) && (
                <div className="flex justify-between text-sm font-bold text-slate-900 border-t-2 border-slate-900 pt-2">
                  <span>Net Balance Due:</span>
                  <span className={data.remainingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                    {formatCurrency(data.remainingBalance)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Terms & Signatures */}
          <div className="mt-10 pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-[11px] text-slate-500">
            <div>
              <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1">Terms & Conditions:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Goods stored at customer risk. Valid receipt required for stock release.</li>
                <li>Monthly storage rent payable upon outward stock dispatch.</li>
              </ul>
            </div>
            <div className="flex flex-col items-end justify-end text-right">
              <div className="w-44 border-b border-slate-400 pb-1 mb-1"></div>
              <p className="font-bold text-slate-800">Authorized Signatory</p>
              <p className="text-[10px] text-slate-400">For {company.companyName}</p>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3 print:hidden">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-1.5" />
            Print Receipt
          </Button>
        </div>
      </div>
    </div>
  );
};
