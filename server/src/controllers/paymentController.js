const Payment = require('../models/Payment');
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const ActivityLog = require('../models/ActivityLog');
const Settings = require('../models/Settings');
const { generatePaymentId } = require('../utils/idGenerators');

const createPayment = async (req, res) => {
  try {
    const { customerId, amount, paymentMethod = 'Cash', referenceNumber = '', relatedLotId, remarks = '', date = new Date() } = req.body;

    if (!customerId || !amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Customer and valid payment amount are required' });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const paymentAmount = Number(amount);
    const paymentNumber = await generatePaymentId();

    const payment = await Payment.create({
      paymentNumber,
      customer: customer._id,
      date,
      amount: paymentAmount,
      paymentMethod,
      referenceNumber,
      relatedLot: relatedLotId || null,
      remarks,
    });

    const previousBalance = customer.outstandingBalance || 0;
    const newBalance = previousBalance - paymentAmount;
    customer.outstandingBalance = newBalance;
    await customer.save();

    // Record in Customer Ledger
    await Transaction.create({
      customer: customer._id,
      date,
      transactionType: 'Payment',
      reference: paymentNumber,
      debit: 0,
      credit: paymentAmount,
      balance: newBalance,
      remarks: remarks || `Payment received via ${paymentMethod}`,
    });

    // Log Activity
    await ActivityLog.create({
      type: 'PAYMENT',
      title: 'Payment Received',
      description: `₹${paymentAmount.toLocaleString()} received from ${customer.name} via ${paymentMethod} (Ref: ${paymentNumber})`,
      meta: { paymentNumber, customerName: customer.name, amount: paymentAmount },
    });

    const settings = await Settings.findOne() || {};

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        payment,
        receipt: {
          company: settings,
          paymentNumber,
          date,
          customer: {
            id: customer._id,
            customerId: customer.customerId,
            name: customer.name,
            mobile: customer.mobile,
            village: customer.village,
            district: customer.district,
          },
          amount: paymentAmount,
          paymentMethod,
          referenceNumber,
          previousBalance,
          remainingBalance: newBalance,
          remarks,
        },
      },
    });
  } catch (error) {
    console.error('createPayment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPayments = async (req, res) => {
  try {
    const { search = '', customer, method, page = 1, limit = 50 } = req.query;
    const query = {};

    if (customer && customer !== 'All') query.customer = customer;
    if (method && method !== 'All') query.paymentMethod = method;

    if (search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ paymentNumber: regex }, { referenceNumber: regex }];
    }

    const [total, payments] = await Promise.all([
      Payment.countDocuments(query),
      Payment.find(query)
        .populate('customer', 'name mobile customerId')
        .populate('relatedLot', 'lotNumber')
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean(),
    ]);

    res.json({
      success: true,
      data: payments,
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

const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('customer')
      .populate('relatedLot');
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    res.json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createPayment,
  getPayments,
  getPaymentById,
};
