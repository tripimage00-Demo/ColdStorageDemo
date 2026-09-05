const Customer = require('../models/Customer');
const StockEntry = require('../models/StockEntry');
const Lot = require('../models/Lot');
const StockRelease = require('../models/StockRelease');
const Payment = require('../models/Payment');

const generateCustomerId = async () => {
  const count = await Customer.countDocuments();
  const num = (count + 1).toString().padStart(4, '0');
  return `CUST-2026-${num}`;
};

const generateStockEntryIds = async () => {
  const count = await StockEntry.countDocuments();
  const num = (count + 1).toString().padStart(4, '0');
  return {
    entryNumber: `IN-2026-${num}`,
    receiptNumber: `RCP-2026-${num}`,
    lotNumber: `LOT-2026-${num}`,
  };
};

const generateStockReleaseIds = async () => {
  const count = await StockRelease.countDocuments();
  const num = (count + 1).toString().padStart(4, '0');
  return {
    releaseNumber: `OUT-2026-${num}`,
    receiptNumber: `REL-2026-${num}`,
  };
};

const generatePaymentId = async () => {
  const count = await Payment.countDocuments();
  const num = (count + 1).toString().padStart(4, '0');
  return `PAY-2026-${num}`;
};

module.exports = {
  generateCustomerId,
  generateStockEntryIds,
  generateStockReleaseIds,
  generatePaymentId,
};
