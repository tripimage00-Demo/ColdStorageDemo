const Customer = require('../models/Customer');
const Lot = require('../models/Lot');
const StockEntry = require('../models/StockEntry');
const StockRelease = require('../models/StockRelease');
const Payment = require('../models/Payment');
const { generateCustomerId } = require('../utils/idGenerators');

const getCustomers = async (req, res) => {
  try {
    const { search = '', status, page = 1, limit = 50 } = req.query;
    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: regex },
        { mobile: regex },
        { customerId: regex },
        { village: regex },
        { district: regex },
      ];
    }

    const total = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      data: customers,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error('getCustomers error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id);

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Fetch related lots
    const lots = await Lot.find({ customer: id })
      .populate('commodity', 'name code unit storageRate')
      .populate('chamber', 'name chamberCode')
      .sort({ entryDate: -1 });

    // Fetch inward entries
    const inwardEntries = await StockEntry.find({ customer: id })
      .populate('commodity', 'name code unit')
      .populate('chamber', 'name chamberCode')
      .sort({ date: -1 });

    // Fetch release history
    const releases = await StockRelease.find({ customer: id })
      .populate('commodity', 'name code unit')
      .populate('chamber', 'name chamberCode')
      .populate('lot', 'lotNumber')
      .sort({ releaseDate: -1 });

    // Fetch payments
    const payments = await Payment.find({ customer: id })
      .sort({ date: -1 });

    // Aggregates
    const currentStoredStock = lots.reduce((acc, l) => acc + (l.remainingQuantity || 0), 0);
    const totalQuantityStored = lots.reduce((acc, l) => acc + (l.originalQuantity || 0), 0);
    const totalQuantityReleased = lots.reduce((acc, l) => acc + (l.releasedQuantity || 0), 0);
    const totalPaid = payments.reduce((acc, p) => acc + (p.amount || 0), 0);

    res.json({
      success: true,
      data: {
        customer,
        currentStoredStock,
        totalQuantityStored,
        totalQuantityReleased,
        totalPaid,
        outstandingBalance: customer.outstandingBalance || 0,
        lots,
        inwardEntries,
        releases,
        payments,
      },
    });
  } catch (error) {
    console.error('getCustomerById error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const createCustomer = async (req, res) => {
  try {
    const { name, mobile, altMobile, address, village, district, state, gstNumber, notes } = req.body;

    if (!name || !mobile) {
      return res.status(400).json({ success: false, message: 'Name and Mobile are required' });
    }

    const customerId = await generateCustomerId();

    const customer = await Customer.create({
      customerId,
      name,
      mobile,
      altMobile: altMobile || '',
      address: address || '',
      village: village || '',
      district: district || '',
      state: state || 'Uttar Pradesh',
      gstNumber: gstNumber || '',
      notes: notes || '',
      status: 'Active',
      outstandingBalance: 0,
    });

    res.status(201).json({
      success: true,
      message: 'Customer registered successfully',
      data: customer,
    });
  } catch (error) {
    console.error('createCustomer error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: customer,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const activeLotsCount = await Lot.countDocuments({ customer: id, remainingQuantity: { $gt: 0 } });

    if (activeLotsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete customer. There are currently ${activeLotsCount} active lots with stored goods in cold storage.`,
      });
    }

    await Customer.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Customer removed successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
