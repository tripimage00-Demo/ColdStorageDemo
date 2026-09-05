const Lot = require('../models/Lot');

const getLots = async (req, res) => {
  try {
    const { search = '', status, chamber, commodity, customer, page = 1, limit = 50 } = req.query;
    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (chamber && chamber !== 'All') {
      query.chamber = chamber;
    }

    if (commodity && commodity !== 'All') {
      query.commodity = commodity;
    }

    if (customer && customer !== 'All') {
      query.customer = customer;
    }

    let lotsQuery = Lot.find(query)
      .populate('customer', 'name mobile village customerId')
      .populate('commodity', 'name code unit storageRate rateType')
      .populate('chamber', 'name chamberCode')
      .sort({ entryDate: -1 });

    let lots = await lotsQuery;

    // Filter in memory for customer name / mobile search if provided
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      lots = lots.filter((lot) => {
        const lotNoMatch = lot.lotNumber?.toLowerCase().includes(s);
        const custNameMatch = lot.customer?.name?.toLowerCase().includes(s);
        const custMobileMatch = lot.customer?.mobile?.toLowerCase().includes(s);
        const commNameMatch = lot.commodity?.name?.toLowerCase().includes(s);
        const chNameMatch = lot.chamber?.name?.toLowerCase().includes(s);
        return lotNoMatch || custNameMatch || custMobileMatch || commNameMatch || chNameMatch;
      });
    }

    const total = lots.length;
    const startIndex = (page - 1) * limit;
    const paginatedLots = lots.slice(startIndex, startIndex + Number(limit));

    res.json({
      success: true,
      data: paginatedLots,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getLotById = async (req, res) => {
  try {
    const lot = await Lot.findById(req.params.id)
      .populate('customer')
      .populate('commodity')
      .populate('chamber')
      .populate('stockEntry');

    if (!lot) {
      return res.status(404).json({ success: false, message: 'Lot not found' });
    }

    res.json({ success: true, data: lot });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getLots,
  getLotById,
};
