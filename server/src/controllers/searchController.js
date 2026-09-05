const Customer = require('../models/Customer');
const Lot = require('../models/Lot');
const StockEntry = require('../models/StockEntry');
const StockRelease = require('../models/StockRelease');
const Commodity = require('../models/Commodity');

const globalSearch = async (req, res) => {
  try {
    const { query = '' } = req.query;
    if (!query.trim()) {
      return res.json({
        success: true,
        data: { customers: [], lots: [], entries: [], releases: [], commodities: [] },
      });
    }

    const regex = new RegExp(query.trim(), 'i');

    const [customers, lots, entries, releases, commodities] = await Promise.all([
      Customer.find({
        $or: [{ name: regex }, { mobile: regex }, { customerId: regex }, { village: regex }],
      }).limit(5),

      Lot.find({
        $or: [{ lotNumber: regex }],
      })
        .populate('customer', 'name mobile')
        .populate('commodity', 'name unit')
        .populate('chamber', 'name')
        .limit(5),

      StockEntry.find({
        $or: [{ entryNumber: regex }, { receiptNumber: regex }, { vehicleNumber: regex }],
      })
        .populate('customer', 'name')
        .populate('commodity', 'name')
        .limit(5),

      StockRelease.find({
        $or: [{ releaseNumber: regex }, { receiptNumber: regex }],
      })
        .populate('customer', 'name')
        .populate('commodity', 'name')
        .limit(5),

      Commodity.find({
        $or: [{ name: regex }, { code: regex }],
      }).limit(5),
    ]);

    res.json({
      success: true,
      data: {
        customers,
        lots,
        entries,
        releases,
        commodities,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  globalSearch,
};
