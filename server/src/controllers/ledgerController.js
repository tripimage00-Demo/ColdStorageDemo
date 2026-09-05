const Transaction = require('../models/Transaction');
const Customer = require('../models/Customer');

const getCustomerLedger = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { startDate, endDate, transactionType } = req.query;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const query = { customer: customerId };

    if (transactionType && transactionType !== 'All') {
      query.transactionType = transactionType;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const transactions = await Transaction.find(query).sort({ date: 1, createdAt: 1 });

    const totalDebit = transactions.reduce((sum, t) => sum + (t.debit || 0), 0);
    const totalCredit = transactions.reduce((sum, t) => sum + (t.credit || 0), 0);

    res.json({
      success: true,
      data: {
        customer,
        currentOutstandingBalance: customer.outstandingBalance || 0,
        totalDebit,
        totalCredit,
        transactions,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createAdjustment = async (req, res) => {
  try {
    const { customerId, amount, type = 'Debit', remarks = '', date = new Date() } = req.body;
    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    const adjAmount = Number(amount);
    const isDebit = type.toLowerCase() === 'debit';
    const debit = isDebit ? adjAmount : 0;
    const credit = !isDebit ? adjAmount : 0;

    const previousBalance = customer.outstandingBalance || 0;
    const newBalance = isDebit ? previousBalance + adjAmount : previousBalance - adjAmount;
    customer.outstandingBalance = newBalance;
    await customer.save();

    const count = await Transaction.countDocuments();
    const reference = `ADJ-2026-${(count + 1).toString().padStart(4, '0')}`;

    const transaction = await Transaction.create({
      customer: customer._id,
      date,
      transactionType: 'Adjustment',
      reference,
      debit,
      credit,
      balance: newBalance,
      remarks: remarks || `Manual ${type} adjustment`,
    });

    res.status(201).json({
      success: true,
      message: 'Ledger adjustment created successfully',
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCustomerLedger,
  createAdjustment,
};
