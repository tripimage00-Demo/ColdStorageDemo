const Chamber = require('../models/Chamber');
const Customer = require('../models/Customer');
const Lot = require('../models/Lot');
const StockEntry = require('../models/StockEntry');
const StockRelease = require('../models/StockRelease');
const Payment = require('../models/Payment');
const ActivityLog = require('../models/ActivityLog');

const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // 1. Capacity stats from Chambers
    const chambers = await Chamber.find().sort({ chamberCode: 1 });
    const totalStorageCapacity = chambers.reduce((acc, c) => acc + c.maxCapacity, 0);
    const currentlyOccupied = chambers.reduce((acc, c) => acc + c.currentOccupancy, 0);
    const availableCapacity = Math.max(0, totalStorageCapacity - currentlyOccupied);
    const occupancyPercentage =
      totalStorageCapacity > 0
        ? Math.round((currentlyOccupied / totalStorageCapacity) * 1000) / 10
        : 0;

    // 2. Counts
    const totalCustomers = await Customer.countDocuments({ status: 'Active' });
    const totalStockLots = await Lot.countDocuments({ remainingQuantity: { $gt: 0 } });

    // 3. Today's Movements
    const stockReceivedTodayDocs = await StockEntry.find({ date: { $gte: today } });
    const stockReceivedToday = stockReceivedTodayDocs.reduce((acc, s) => acc + (s.quantity || 0), 0);

    const stockReleasedTodayDocs = await StockRelease.find({ releaseDate: { $gte: today } });
    const stockReleasedToday = stockReleasedTodayDocs.reduce((acc, s) => acc + (s.releaseQuantity || 0), 0);

    // 4. Financials
    const allCustomers = await Customer.find({ outstandingBalance: { $gt: 0 } });
    const totalOutstandingPayments = allCustomers.reduce((acc, c) => acc + (c.outstandingBalance || 0), 0);

    const monthlyPayments = await Payment.find({ date: { $gte: firstDayOfMonth } });
    const paymentsCollectedThisMonth = monthlyPayments.reduce((acc, p) => acc + (p.amount || 0), 0);

    // 5. Commodity distribution
    const activeLots = await Lot.find({ remainingQuantity: { $gt: 0 } }).populate('commodity', 'name unit');
    const commodityMap = {};
    activeLots.forEach((lot) => {
      const name = lot.commodity?.name || 'Other';
      commodityMap[name] = (commodityMap[name] || 0) + (lot.remainingQuantity || 0);
    });
    const commodityDistribution = Object.keys(commodityMap).map((key) => ({
      name: key,
      quantity: commodityMap[key],
    }));

    // 6. Monthly Inward vs Outward Trend (Last 6 Months)
    const monthlyStockTrends = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const end = new Date(today.getFullYear(), today.getMonth() - i + 1, 0, 23, 59, 59);
      const monthLabel = start.toLocaleString('en-US', { month: 'short' });

      const monthInward = await StockEntry.find({ date: { $gte: start, $lte: end } });
      const monthOutward = await StockRelease.find({ releaseDate: { $gte: start, $lte: end } });
      const monthPay = await Payment.find({ date: { $gte: start, $lte: end } });

      monthlyStockTrends.push({
        month: monthLabel,
        inward: monthInward.reduce((s, x) => s + (x.quantity || 0), 0),
        outward: monthOutward.reduce((s, x) => s + (x.releaseQuantity || 0), 0),
        payments: monthPay.reduce((s, x) => s + (x.amount || 0), 0),
      });
    }

    // 7. Recent Activity
    const recentActivity = await ActivityLog.find().sort({ createdAt: -1 }).limit(8);

    // 8. Alerts
    const alerts = [];
    chambers.forEach((ch) => {
      const pct = ch.maxCapacity > 0 ? (ch.currentOccupancy / ch.maxCapacity) * 100 : 0;
      if (pct >= 85) {
        alerts.push({
          id: `ch-${ch._id}`,
          type: 'warning',
          title: `Chamber ${ch.name} Near Capacity`,
          message: `${ch.name} is currently at ${Math.round(pct)}% capacity (${ch.currentOccupancy.toLocaleString()} / ${ch.maxCapacity.toLocaleString()} packets).`,
        });
      }
    });

    const highDueCustomers = await Customer.find({ outstandingBalance: { $gte: 25000 } }).limit(3);
    highDueCustomers.forEach((c) => {
      alerts.push({
        id: `cust-${c._id}`,
        type: 'error',
        title: 'Outstanding Dues Overdue',
        message: `${c.name} has ₹${c.outstandingBalance.toLocaleString()} in unpaid storage charges.`,
      });
    });

    // Check long stored lots (> 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const oldLots = await Lot.find({ entryDate: { $lte: ninetyDaysAgo }, remainingQuantity: { $gt: 0 } })
      .populate('customer', 'name')
      .populate('commodity', 'name')
      .limit(2);

    oldLots.forEach((l) => {
      alerts.push({
        id: `lot-${l._id}`,
        type: 'info',
        title: 'Long Storage Alert',
        message: `Lot ${l.lotNumber} (${l.commodity?.name}) has been stored for >90 days for ${l.customer?.name}.`,
      });
    });

    res.json({
      success: true,
      data: {
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
        chambers: chambers.map((c) => c.toJSON()),
        commodityDistribution,
        monthlyStockTrends,
        recentActivity,
        alerts,
      },
    });
  } catch (error) {
    console.error('getDashboardStats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardStats,
};
