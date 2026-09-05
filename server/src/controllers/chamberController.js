const Chamber = require('../models/Chamber');
const Lot = require('../models/Lot');

const getChambers = async (req, res) => {
  try {
    const chambers = await Chamber.find().sort({ chamberCode: 1 });

    // Fetch active lot counts for each chamber
    const enrichedChambers = await Promise.all(
      chambers.map(async (ch) => {
        const activeLots = await Lot.countDocuments({
          chamber: ch._id,
          remainingQuantity: { $gt: 0 },
        });
        const chObj = ch.toJSON();
        chObj.activeLotsCount = activeLots;
        return chObj;
      })
    );

    res.json({
      success: true,
      data: enrichedChambers,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getChamberById = async (req, res) => {
  try {
    const chamber = await Chamber.findById(req.params.id);
    if (!chamber) {
      return res.status(404).json({ success: false, message: 'Chamber not found' });
    }

    const lots = await Lot.find({ chamber: req.params.id, remainingQuantity: { $gt: 0 } })
      .populate('customer', 'name mobile')
      .populate('commodity', 'name unit')
      .sort({ entryDate: -1 });

    res.json({
      success: true,
      data: {
        chamber: chamber.toJSON(),
        lots,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createChamber = async (req, res) => {
  try {
    const { name, chamberCode, maxCapacity, temperature, status, description } = req.body;
    if (!name || !chamberCode || !maxCapacity) {
      return res.status(400).json({ success: false, message: 'Name, Chamber Code, and Max Capacity are required' });
    }

    const existing = await Chamber.findOne({ chamberCode: chamberCode.toUpperCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Chamber code already exists' });
    }

    const chamber = await Chamber.create({
      name,
      chamberCode: chamberCode.toUpperCase().trim(),
      maxCapacity: Number(maxCapacity),
      currentOccupancy: 0,
      temperature: temperature !== undefined ? Number(temperature) : 2.0,
      status: status || 'Active',
      description: description || '',
    });

    res.status(201).json({
      success: true,
      message: 'Chamber registered successfully',
      data: chamber,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateChamber = async (req, res) => {
  try {
    const chamber = await Chamber.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!chamber) {
      return res.status(404).json({ success: false, message: 'Chamber not found' });
    }
    res.json({
      success: true,
      message: 'Chamber updated successfully',
      data: chamber,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteChamber = async (req, res) => {
  try {
    const activeLots = await Lot.countDocuments({
      chamber: req.params.id,
      remainingQuantity: { $gt: 0 },
    });
    if (activeLots > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete chamber. There are ${activeLots} active lots currently stored in it.`,
      });
    }

    await Chamber.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Chamber deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getChambers,
  getChamberById,
  createChamber,
  updateChamber,
  deleteChamber,
};
