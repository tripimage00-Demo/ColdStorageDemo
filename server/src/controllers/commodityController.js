const Commodity = require('../models/Commodity');
const Lot = require('../models/Lot');

const getCommodities = async (req, res) => {
  try {
    const { search = '', status } = req.query;
    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { code: regex }];
    }

    const commodities = await Commodity.find(query).sort({ name: 1 });

    res.json({
      success: true,
      data: commodities,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCommodityById = async (req, res) => {
  try {
    const commodity = await Commodity.findById(req.params.id);
    if (!commodity) {
      return res.status(404).json({ success: false, message: 'Commodity not found' });
    }
    res.json({ success: true, data: commodity });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createCommodity = async (req, res) => {
  try {
    const { name, code, storageRate, rateType, unit, description } = req.body;
    if (!name || !code || storageRate === undefined) {
      return res.status(400).json({ success: false, message: 'Name, code, and storage rate are required' });
    }

    const existing = await Commodity.findOne({ code: code.toUpperCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Commodity with this code already exists' });
    }

    const commodity = await Commodity.create({
      name,
      code: code.toUpperCase().trim(),
      storageRate: Number(storageRate),
      rateType: rateType || 'per_month',
      unit: unit || 'Bag',
      description: description || '',
      status: 'Active',
    });

    res.status(201).json({
      success: true,
      message: 'Commodity created successfully',
      data: commodity,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateCommodity = async (req, res) => {
  try {
    const commodity = await Commodity.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!commodity) {
      return res.status(404).json({ success: false, message: 'Commodity not found' });
    }
    res.json({
      success: true,
      message: 'Commodity updated successfully',
      data: commodity,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteCommodity = async (req, res) => {
  try {
    const activeLots = await Lot.countDocuments({
      commodity: req.params.id,
      remainingQuantity: { $gt: 0 },
    });
    if (activeLots > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete commodity. It is currently stored in ${activeLots} active lots.`,
      });
    }

    await Commodity.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Commodity deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCommodities,
  getCommodityById,
  createCommodity,
  updateCommodity,
  deleteCommodity,
};
