const Chamber = require('../models/Chamber');
const Customer = require('../models/Customer');
const Lot = require('../models/Lot');
const StockEntry = require('../models/StockEntry');
const StockRelease = require('../models/StockRelease');
const Payment = require('../models/Payment');
const ActivityLog = require('../models/ActivityLog');

// Server-side cache for high-frequency dashboard requests (15 seconds TTL)
let cachedStats = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 15000;

const invalidateDashboardCache = () => {
  cachedStats = null;
  lastCacheTime = 0;
};

const getDashboardStats = async (req, res) => {
  try {
    const now = Date.now();
    if (cachedStats && now - lastCacheTime < CACHE_TTL_MS) {
      return res.json({
        success: true,
        data: cachedStats,
        cached: true,
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Date for 6 months ago
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Execute all independent queries in parallel via Promise.all
    const [
      chambers,
      totalCustomers,
      totalStockLots,
      stockReceivedTodayDocs,
      stockReleasedTodayDocs,
      allCustomersWithDues,
      monthlyPaymentsDocs,
      activeLots,
      sixMonthInwardDocs,
      sixMonthOutwardDocs,
      sixMonthPayDocs,
      recentActivity,
      highDueCustomers,
      oldLots,
    ] = await Promise.all([
      // 1. Chambers
      Chamber.find().sort({ chamberCode: 1 }).lean(),

      // 2. Counts
      Customer.countDocuments({ status: 'Active' }),
      Lot.countDocuments({ remainingQuantity: { $gt: 0 } }),

      // 3. Today's Movements
      StockEntry.find({ date: { $gte: today } }).select('quantity').lean(),
      StockRelease.find({ releaseDate: { $gte: today } }).select('releaseQuantity').lean(),

      // 4. Financials
      Customer.find({ outstandingBalance: { $gt: 0 } }).select('outstandingBalance').lean(),
      Payment.find({ date: { $gte: firstDayOfMonth } }).select('amount').lean(),

      // 5. Active Lots for Commodity Distribution
      Lot.find({ remainingQuantity: { $gt: 0 } })
        .populate('commodity', 'name unit')
        .select('commodity remainingQuantity')
        .lean(),

      // 6. 6-Month batch data (single query each instead of 18 loop queries)
      StockEntry.find({ date: { $gte: sixMonthsAgo } }).select('date quantity').lean(),
      StockRelease.find({ releaseDate: { $gte: sixMonthsAgo } }).select('releaseDate releaseQuantity').lean(),
      Payment.find({ date: { $gte: sixMonthsAgo } }).select('date amount').lean(),

      // 7. Recent Activity
      ActivityLog.find().sort({ createdAt: -1 }).limit(8).lean(),

      // 8. Alerts
      Customer.find({ outstandingBalance: { $gte: 25000 } }).select('name outstandingBalance').limit(3).lean(),
      Lot.find({ entryDate: { $lte: ninetyDaysAgo }, remainingQuantity: { $gt: 0 } })
        .populate('customer', 'name')
        .populate('commodity', 'name')
        .select('lotNumber customer commodity')
        .limit(2)
        .lean(),
    ]);

    // 1. Capacity metrics
    const totalStorageCapacity = chambers.reduce((acc, c) => acc + (c.maxCapacity || 0), 0);
    const currentlyOccupied = chambers.reduce((acc, c) => acc + (c.currentOccupancy || 0), 0);
    const availableCapacity = Math.max(0, totalStorageCapacity - currentlyOccupied);
    const occupancyPercentage =
      totalStorageCapacity > 0
        ? Math.round((currentlyOccupied / totalStorageCapacity) * 1000) / 10
        : 0;

    // 2. Today's Movements
    const stockReceivedToday = stockReceivedTodayDocs.reduce((acc, s) => acc + (s.quantity || 0), 0);
    const stockReleasedToday = stockReleasedTodayDocs.reduce((acc, s) => acc + (s.releaseQuantity || 0), 0);

    // 3. Financials
    const totalOutstandingPayments = allCustomersWithDues.reduce((acc, c) => acc + (c.outstandingBalance || 0), 0);
    const paymentsCollectedThisMonth = monthlyPaymentsDocs.reduce((acc, p) => acc + (p.amount || 0), 0);

    // 4. Commodity distribution
    const commodityMap = {};
    activeLots.forEach((lot) => {
      const name = lot.commodity?.name || 'Other';
      commodityMap[name] = (commodityMap[name] || 0) + (lot.remainingQuantity || 0);
    });
    const commodityDistribution = Object.keys(commodityMap).map((key) => ({
      name: key,
      quantity: commodityMap[key],
    }));

    // 5. Monthly trends grouped in memory (fast O(N) indexing)
    const monthlyStockTrends = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const end = new Date(today.getFullYear(), today.getMonth() - i + 1, 0, 23, 59, 59, 999);
      const monthLabel = start.toLocaleString('en-US', { month: 'short' });
      const startTime = start.getTime();
      const endTime = end.getTime();

      const inwardSum = sixMonthInwardDocs.reduce((sum, item) => {
        const t = new Date(item.date).getTime();
        return t >= startTime && t <= endTime ? sum + (item.quantity || 0) : sum;
      }, 0);

      const outwardSum = sixMonthOutwardDocs.reduce((sum, item) => {
        const t = new Date(item.releaseDate).getTime();
        return t >= startTime && t <= endTime ? sum + (item.releaseQuantity || 0) : sum;
      }, 0);

      const paySum = sixMonthPayDocs.reduce((sum, item) => {
        const t = new Date(item.date).getTime();
        return t >= startTime && t <= endTime ? sum + (item.amount || 0) : sum;
      }, 0);

      monthlyStockTrends.push({
        month: monthLabel,
        inward: inwardSum,
        outward: outwardSum,
        payments: paySum,
      });
    }

    // 6. Alerts
    const alerts = [];
    chambers.forEach((ch) => {
      const pct = ch.maxCapacity > 0 ? (ch.currentOccupancy / ch.maxCapacity) * 100 : 0;
      if (pct >= 85) {
        alerts.push({
          id: `ch-${ch._id}`,
          type: 'warning',
          title: `Chamber ${ch.name} Near Capacity`,
          message: `${ch.name} is currently at ${Math.round(pct)}% capacity (${(ch.currentOccupancy || 0).toLocaleString()} / ${(ch.maxCapacity || 0).toLocaleString()} packets).`,
        });
      }
    });

    highDueCustomers.forEach((c) => {
      alerts.push({
        id: `cust-${c._id}`,
        type: 'error',
        title: 'Outstanding Dues Overdue',
        message: `${c.name} has ₹${(c.outstandingBalance || 0).toLocaleString()} in unpaid storage charges.`,
      });
    });

    oldLots.forEach((l) => {
      alerts.push({
        id: `lot-${l._id}`,
        type: 'info',
        title: 'Long Storage Alert',
        message: `Lot ${l.lotNumber} (${l.commodity?.name || 'Stock'}) has been stored for >90 days for ${l.customer?.name || 'Customer'}.`,
      });
    });

    const responseData = {
      stats: {
        totalStorageCapacity,
        currentlyOccupied,
        availableCapacity,
        occupancyPercentage,
        totalCustomers,
        totalStockLots,
        stockReceivedToday,
        stockReleasedToday,
        totalOutstandingPayments,
        paymentsCollectedThisMonth,
      },
      chambers: chambers.map((c) => ({
        ...c,
        id: c._id,
      })),
      commodityDistribution,
      monthlyStockTrends,
      recentActivity,
      alerts,
    };

    cachedStats = responseData;
    lastCacheTime = now;

    res.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error('getDashboardStats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  invalidateDashboardCache,
};
