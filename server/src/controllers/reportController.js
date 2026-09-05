const StockEntry = require('../models/StockEntry');
const StockRelease = require('../models/StockRelease');
const Lot = require('../models/Lot');
const Chamber = require('../models/Chamber');
const Customer = require('../models/Customer');
const Commodity = require('../models/Commodity');
const Payment = require('../models/Payment');

const getDateRangeFilter = (timeframe, startDate, endDate) => {
  const now = new Date();
  let start = null;
  let end = new Date();

  if (timeframe === 'Today') {
    start = new Date();
    start.setHours(0, 0, 0, 0);
  } else if (timeframe === 'This Week') {
    start = new Date();
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
  } else if (timeframe === 'This Month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (timeframe === 'Custom' && startDate) {
    start = new Date(startDate);
    if (endDate) {
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    }
  }

  return { start, end };
};

// 1. Stock Reports
const getStockReports = async (req, res) => {
  try {
    const { timeframe = 'This Month', startDate, endDate } = req.query;
    const { start, end } = getDateRangeFilter(timeframe, startDate, endDate);

    const dateQuery = {};
    if (start) {
      dateQuery.date = { $gte: start, $lte: end };
    }

    // Inward stock
    const inwardEntries = await StockEntry.find(start ? { date: { $gte: start, $lte: end } } : {})
      .populate('customer', 'name customerId mobile')
      .populate('commodity', 'name unit')
      .populate('chamber', 'name chamberCode')
      .sort({ date: -1 });

    // Outward releases
    const outwardEntries = await StockRelease.find(start ? { releaseDate: { $gte: start, $lte: end } } : {})
      .populate('customer', 'name customerId mobile')
      .populate('commodity', 'name unit')
      .populate('chamber', 'name chamberCode')
      .sort({ releaseDate: -1 });

    // Currently stored stock (active lots)
    const activeLots = await Lot.find({ remainingQuantity: { $gt: 0 } })
      .populate('customer', 'name customerId')
      .populate('commodity', 'name unit')
      .populate('chamber', 'name chamberCode');

    // Commodity-wise aggregation
    const commodityMap = {};
    activeLots.forEach((l) => {
      const name = l.commodity?.name || 'Unknown';
      if (!commodityMap[name]) {
        commodityMap[name] = { name, quantity: 0, unit: l.commodity?.unit || 'Bag', lotsCount: 0 };
      }
      commodityMap[name].quantity += l.remainingQuantity;
      commodityMap[name].lotsCount += 1;
    });

    // Chamber-wise aggregation
    const chamberMap = {};
    activeLots.forEach((l) => {
      const name = l.chamber?.name || 'Unknown';
      if (!chamberMap[name]) {
        chamberMap[name] = { name, code: l.chamber?.chamberCode || '', quantity: 0, lotsCount: 0 };
      }
      chamberMap[name].quantity += l.remainingQuantity;
      chamberMap[name].lotsCount += 1;
    });

    // Customer-wise aggregation
    const customerMap = {};
    activeLots.forEach((l) => {
      const name = l.customer?.name || 'Unknown';
      if (!customerMap[name]) {
        customerMap[name] = { name, customerId: l.customer?.customerId || '', quantity: 0, lotsCount: 0 };
      }
      customerMap[name].quantity += l.remainingQuantity;
      customerMap[name].lotsCount += 1;
    });

    const totalInwardQty = inwardEntries.reduce((s, i) => s + i.quantity, 0);
    const totalOutwardQty = outwardEntries.reduce((s, o) => s + o.releaseQuantity, 0);
    const totalCurrentStock = activeLots.reduce((s, l) => s + l.remainingQuantity, 0);

    res.json({
      success: true,
      data: {
        timeframe,
        totalCurrentStock,
        totalInwardQty,
        totalOutwardQty,
        inwardEntries,
        outwardEntries,
        activeLots,
        commodityWise: Object.values(commodityMap),
        chamberWise: Object.values(chamberMap),
        customerWise: Object.values(customerMap),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Financial Reports
const getFinancialReports = async (req, res) => {
  try {
    const { timeframe = 'This Month', startDate, endDate } = req.query;
    const { start, end } = getDateRangeFilter(timeframe, startDate, endDate);

    const paymentQuery = start ? { date: { $gte: start, $lte: end } } : {};
    const releaseQuery = start ? { releaseDate: { $gte: start, $lte: end } } : {};

    const payments = await Payment.find(paymentQuery)
      .populate('customer', 'name customerId mobile')
      .sort({ date: -1 });

    const releases = await StockRelease.find(releaseQuery)
      .populate('customer', 'name customerId')
      .populate('commodity', 'name')
      .sort({ releaseDate: -1 });

    const customersWithBalance = await Customer.find({ outstandingBalance: { $gt: 0 } })
      .sort({ outstandingBalance: -1 });

    const totalPaymentsCollected = payments.reduce((s, p) => s + p.amount, 0);
    const totalChargesBilled = releases.reduce((s, r) => s + (r.actualCharges || 0), 0);
    const totalOutstandingBalance = customersWithBalance.reduce((s, c) => s + (c.outstandingBalance || 0), 0);

    // Method breakdown
    const paymentMethods = {};
    payments.forEach((p) => {
      paymentMethods[p.paymentMethod] = (paymentMethods[p.paymentMethod] || 0) + p.amount;
    });

    res.json({
      success: true,
      data: {
        timeframe,
        totalPaymentsCollected,
        totalChargesBilled,
        totalOutstandingBalance,
        payments,
        releases,
        customersWithBalance,
        paymentMethods,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Capacity Reports
const getCapacityReports = async (req, res) => {
  try {
    const chambers = await Chamber.find().sort({ chamberCode: 1 });

    const totalCapacity = chambers.reduce((s, c) => s + c.maxCapacity, 0);
    const totalOccupied = chambers.reduce((s, c) => s + c.currentOccupancy, 0);
    const totalAvailable = Math.max(0, totalCapacity - totalOccupied);
    const overallOccupancyPercent = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 1000) / 10 : 0;

    const chamberBreakdown = chambers.map((c) => ({
      id: c._id,
      name: c.name,
      code: c.chamberCode,
      maxCapacity: c.maxCapacity,
      currentOccupancy: c.currentOccupancy,
      availableCapacity: Math.max(0, c.maxCapacity - c.currentOccupancy),
      occupancyPercentage: c.maxCapacity > 0 ? Math.round((c.currentOccupancy / c.maxCapacity) * 1000) / 10 : 0,
      temperature: c.temperature,
      status: c.status,
    }));

    res.json({
      success: true,
      data: {
        totalCapacity,
        totalOccupied,
        totalAvailable,
        overallOccupancyPercent,
        chambers: chamberBreakdown,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getStockReports,
  getFinancialReports,
  getCapacityReports,
};
