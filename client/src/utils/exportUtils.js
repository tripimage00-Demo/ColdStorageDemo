import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { formatCurrency, formatDate } from './formatters';

const cleanNum = (val) => {
  if (typeof val === 'number') return val;
  return Number(val) || 0;
};

// ==========================================
// 1. COLD STORAGE STOCK REPORT
// ==========================================

export const exportStockReportPDF = (stockData = {}, meta = {}) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const { timeframe = 'This Month' } = meta;
  const activeLots = stockData.activeLots || [];

  // Header
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, doc.internal.pageSize.width, 24, 'F');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('SMARTCOLD STORAGE MANAGEMENT - INVENTORY & STOCK AUDIT REPORT', 14, 11);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(`Audit Period: ${timeframe}  |  Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 18);

  const tableData = activeLots.map((l, idx) => [
    idx + 1,
    l.lotNumber || '',
    l.customer?.name || 'Unknown',
    l.commodity?.name || '',
    l.chamber?.name || '',
    formatDate(l.entryDate),
    `${l.originalQuantity || 0} pkts`,
    `${l.releasedQuantity || 0} pkts`,
    `${l.remainingQuantity || 0} pkts`,
    l.status || 'Stored',
  ]);

  autoTable(doc, {
    startY: 32,
    head: [[
      '#',
      'Lot Number',
      'Customer / Farmer',
      'Commodity',
      'Chamber',
      'Entry Date',
      'Original Qty',
      'Released Qty',
      'Remaining Stock',
      'Status',
    ]],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2.5, textColor: [30, 41, 59] },
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
  });

  doc.save(`SmartCold_Stock_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
};

export const exportStockReportExcel = (stockData = {}, meta = {}) => {
  const activeLots = stockData.activeLots || [];
  const data = activeLots.map((l, idx) => ({
    'S.No': idx + 1,
    'Lot Number': l.lotNumber,
    'Customer Name': l.customer?.name || '',
    'Customer Mobile': l.customer?.mobile || '',
    'Commodity': l.commodity?.name || '',
    'Chamber': l.chamber?.name || '',
    'Entry Date': formatDate(l.entryDate),
    'Original Quantity (Packets)': l.originalQuantity,
    'Released Quantity (Packets)': l.releasedQuantity,
    'Remaining Stock (Packets)': l.remainingQuantity,
    'Status': l.status,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock Audit');
  XLSX.writeFile(workbook, `SmartCold_Stock_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

// ==========================================
// 2. FINANCIAL REPORT (PDF & EXCEL)
// ==========================================

export const exportFinancialReportPDF = (finData = {}, meta = {}) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const { timeframe = 'This Month' } = meta;
  const payments = finData.payments || [];

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, doc.internal.pageSize.width, 24, 'F');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('SMARTCOLD STORAGE MANAGEMENT - FINANCIAL COLLECTIONS & DUES AUDIT', 14, 11);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(`Audit Period: ${timeframe}  |  Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 18);

  const tableData = payments.map((p, idx) => [
    idx + 1,
    p.paymentNumber || '',
    p.customer?.name || '',
    formatDate(p.date),
    p.paymentMethod || 'Cash',
    p.referenceNumber || '—',
    `Rs. ${cleanNum(p.amount).toLocaleString('en-IN')}`,
    p.remarks || '—',
  ]);

  autoTable(doc, {
    startY: 32,
    head: [['#', 'Payment Ref #', 'Customer Name', 'Date', 'Payment Channel', 'UTR / Cheque', 'Amount Paid', 'Remarks']],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2.5, textColor: [30, 41, 59] },
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
  });

  doc.save(`SmartCold_Financial_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
};

export const exportFinancialReportExcel = (finData = {}, meta = {}) => {
  const payments = finData.payments || [];
  const data = payments.map((p, idx) => ({
    'S.No': idx + 1,
    'Payment ID': p.paymentNumber,
    'Customer Name': p.customer?.name || '',
    'Payment Date': formatDate(p.date),
    'Method': p.paymentMethod,
    'Reference / UTR': p.referenceNumber || '',
    'Amount (INR)': p.amount,
    'Remarks': p.remarks || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Payment Collections');
  XLSX.writeFile(workbook, `SmartCold_Financial_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

// Generic CSV Downloader
export const exportDataToCSV = (rows = [], filename = 'report.csv') => {
  if (!rows || rows.length === 0) return;
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
