const Settings = require('../models/Settings');

const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        companyName: 'SmartCold Storage Management',
        tagline: 'Simple Storage. Better Control.',
        ownerName: 'Rajesh Agarwal',
        address: 'NH-19 Agra Highway Bypass, Sikandra, Agra, Uttar Pradesh - 282007',
        phone: '+91 98765 43210',
        email: 'contact@smartcold.com',
        gstNumber: '09AAACS1234F1Z5',
        defaultStorageRate: 20,
        currency: '₹',
      });
    }

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create(req.body);
    } else {
      settings = await Settings.findByIdAndUpdate(settings._id, req.body, {
        new: true,
        runValidators: true,
      });
    }

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: settings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSettings,
  updateSettings,
};
