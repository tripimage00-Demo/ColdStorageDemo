const StockEntry = require('../models/StockEntry');
const Lot = require('../models/Lot');
const StockRelease = require('../models/StockRelease');
const Chamber = require('../models/Chamber');
const Customer = require('../models/Customer');
const Commodity = require('../models/Commodity');
const Payment = require('../models/Payment');
const Transaction = require('../models/Transaction');
const ActivityLog = require('../models/ActivityLog');
const Settings = require('../models/Settings');
const { generateStockEntryIds, generateStockReleaseIds, generatePaymentId } = require('../utils/idGenerators');
const { calculateStorageCharges } = require('../utils/chargeCalculator');

// ==================== INWARD (ADD STOCK) ====================

const createStockInward = async (req, res) => {
  try {
    const {
      customerId,
      commodityId,
      chamberId,
      quantity,
      weightPerPacket = 50,
      storageRate,
      rateType = 'per_month',
      vehicleNumber = '',
      driverName = '',
      qualityGrade = 'Grade A',
      remarks = '',
      date = new Date(),
    } = req.body;

    if (!customerId || !commodityId || !chamberId || !quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Customer, Commodity, Chamber, and valid Quantity are required',
      });
    }

    const [customer, commodity, chamber] = await Promise.all([
      Customer.findById(customerId),
      Commodity.findById(commodityId),
      Chamber.findById(chamberId),
    ]);

    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    if (!commodity) return res.status(404).json({ success: false, message: 'Commodity not found' });
    if (!chamber) return res.status(404).json({ success: false, message: 'Chamber not found' });

    // Enforce chamber capacity rule: Stock cannot be added beyond chamber capacity
    const availableCapacity = chamber.maxCapacity - chamber.currentOccupancy;
    if (Number(quantity) > availableCapacity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient chamber capacity! Chamber "${chamber.name}" only has ${availableCapacity.toLocaleString()} packets available, but inward request is ${Number(quantity).toLocaleString()} packets.`,
      });
    }

    const rate = storageRate !== undefined && storageRate !== '' ? Number(storageRate) : commodity.storageRate;
    const finalRateType = rateType || commodity.rateType;
    const totalWeight = Number(quantity) * Number(weightPerPacket);

    // Auto-generate IDs
    const { entryNumber, receiptNumber, lotNumber } = await generateStockEntryIds();

    // 1. Create StockEntry
    const stockEntry = await StockEntry.create({
      entryNumber,
      receiptNumber,
      lotNumber,
      date,
      customer: customer._id,
      commodity: commodity._id,
      chamber: chamber._id,
      quantity: Number(quantity),
      weightPerPacket: Number(weightPerPacket),
      totalWeight,
      storageRate: rate,
      rateType: finalRateType,
      vehicleNumber,
      driverName,
      qualityGrade,
      remarks,
    });

    // 2. Create Lot
    const lot = await Lot.create({
      lotNumber,
      stockEntry: stockEntry._id,
      customer: customer._id,
      commodity: commodity._id,
      chamber: chamber._id,
      entryDate: date,
      originalQuantity: Number(quantity),
      remainingQuantity: Number(quantity),
      releasedQuantity: 0,
      storageRate: rate,
      rateType: finalRateType,
      status: 'Stored',
      remarks,
    });

    // 3. Update Chamber Occupancy
    chamber.currentOccupancy += Number(quantity);
    if (chamber.currentOccupancy >= chamber.maxCapacity) {
      chamber.status = 'Full';
    }
    await chamber.save();

    // 4. Log Activity
    await ActivityLog.create({
      type: 'INWARD',
      title: 'Stock Inward Registered',
      description: `${quantity} ${commodity.unit}s of ${commodity.name} received from ${customer.name} (Lot: ${lotNumber}, Chamber: ${chamber.name})`,
      meta: { entryNumber, lotNumber, customerName: customer.name, quantity },
    });

    // Fetch company settings for receipt header
    const settings = await Settings.findOne() || {};

    res.status(201).json({
      success: true,
      message: 'Stock inward recorded successfully',
      data: {
        stockEntry,
        lot,
        receipt: {
          company: settings,
          entryNumber,
          receiptNumber,
          lotNumber,
          date,
          customer: {
            id: customer._id,
            customerId: customer.customerId,
            name: customer.name,
            mobile: customer.mobile,
            village: customer.village,
            district: customer.district,
          },
          commodity: {
            name: commodity.name,
            unit: commodity.unit,
          },
          chamber: {
            name: chamber.name,
            code: chamber.chamberCode,
          },
          quantity: Number(quantity),
          weightPerPacket: Number(weightPerPacket),
          totalWeight,
          storageRate: rate,
          rateType: finalRateType,
          vehicleNumber,
          driverName,
          qualityGrade,
          remarks,
        },
      },
    });
  } catch (error) {
    console.error('createStockInward error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getStockInwardEntries = async (req, res) => {
  try {
    const { search = '', chamber, commodity, customer, page = 1, limit = 50 } = req.query;
    const query = {};

    if (chamber && chamber !== 'All') query.chamber = chamber;
    if (commodity && commodity !== 'All') query.commodity = commodity;
    if (customer && customer !== 'All') query.customer = customer;

    if (search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { entryNumber: regex },
        { lotNumber: regex },
        { receiptNumber: regex },
        { vehicleNumber: regex },
      ];
    }

    const total = await StockEntry.countDocuments(query);
    const entries = await StockEntry.find(query)
      .populate('customer', 'name mobile customerId')
      .populate('commodity', 'name unit storageRate')
      .populate('chamber', 'name chamberCode')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      data: entries,
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

// ==================== OUTWARD (STOCK RELEASE & CHARGES) ====================

const previewStorageCharges = async (req, res) => {
  try {
    const { lotId, quantity, releaseDate = new Date() } = req.body;
    if (!lotId || !quantity) {
      return res.status(400).json({ success: false, message: 'Lot ID and quantity are required' });
    }

    const lot = await Lot.findById(lotId)
      .populate('customer', 'name mobile outstandingBalance')
      .populate('commodity', 'name unit storageRate rateType')
      .populate('chamber', 'name');

    if (!lot) return res.status(404).json({ success: false, message: 'Lot not found' });

    if (Number(quantity) > lot.remainingQuantity) {
      return res.status(400).json({
        success: false,
        message: `Quantity to release (${quantity}) exceeds remaining lot stock (${lot.remainingQuantity})`,
      });
    }

    const calculation = calculateStorageCharges({
      quantity: Number(quantity),
      storageRate: lot.storageRate,
      rateType: lot.rateType || lot.commodity?.rateType || 'per_month',
      entryDate: lot.entryDate,
      releaseDate,
    });

    res.json({
      success: true,
      data: {
        lot,
        releaseQuantity: Number(quantity),
        remainingAfterRelease: lot.remainingQuantity - Number(quantity),
        previousCustomerBalance: lot.customer?.outstandingBalance || 0,
        ...calculation,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createStockRelease = async (req, res) => {
  try {
    const {
      lotId,
      releaseQuantity,
      customCharges,
      paymentReceived = 0,
      vehicleNumber = '',
      remarks = '',
      releaseDate = new Date(),
    } = req.body;

    if (!lotId || !releaseQuantity || Number(releaseQuantity) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid lot ID and release quantity are required',
      });
    }

    const lot = await Lot.findById(lotId)
      .populate('customer')
      .populate('commodity')
      .populate('chamber');

    if (!lot) return res.status(404).json({ success: false, message: 'Lot not found' });

    const qty = Number(releaseQuantity);
    if (qty > lot.remainingQuantity) {
      return res.status(400).json({
        success: false,
        message: `Release quantity (${qty}) exceeds remaining stock (${lot.remainingQuantity})`,
      });
    }

    // Auto-calculate charges
    const chargeCalc = calculateStorageCharges({
      quantity: qty,
      storageRate: lot.storageRate,
      rateType: lot.rateType || lot.commodity?.rateType || 'per_month',
      entryDate: lot.entryDate,
      releaseDate,
    });

    const calculatedCharges = chargeCalc.calculatedCharges;
    const actualCharges = customCharges !== undefined && customCharges !== '' ? Number(customCharges) : calculatedCharges;
    const payment = Number(paymentReceived) || 0;

    const previousBalance = lot.customer.outstandingBalance || 0;
    const newBalance = previousBalance + actualCharges - payment;

    // Generate IDs
    const { releaseNumber, receiptNumber } = await generateStockReleaseIds();

    // 1. Update Lot Stock & Status
    lot.releasedQuantity += qty;
    lot.remainingQuantity -= qty;
    lot.status = lot.remainingQuantity === 0 ? 'Released' : 'Partially Released';
    await lot.save();

    // 2. Decrement Chamber Occupancy
    const chamber = await Chamber.findById(lot.chamber._id);
    if (chamber) {
      chamber.currentOccupancy = Math.max(0, chamber.currentOccupancy - qty);
      if (chamber.status === 'Full' && chamber.currentOccupancy < chamber.maxCapacity) {
        chamber.status = 'Active';
      }
      await chamber.save();
    }

    // 3. Update Customer Outstanding Balance
    const customer = await Customer.findById(lot.customer._id);
    customer.outstandingBalance = newBalance;
    await customer.save();

    // 4. Record Storage Charge in Customer Ledger (Debit)
    await Transaction.create({
      customer: customer._id,
      date: releaseDate,
      transactionType: 'Storage Charge',
      reference: releaseNumber,
      debit: actualCharges,
      credit: 0,
      balance: previousBalance + actualCharges,
      remarks: `Storage charges for releasing ${qty} ${lot.commodity.unit}s of ${lot.commodity.name} (Lot: ${lot.lotNumber})`,
    });

    // 5. If immediate payment received, create Payment record and Ledger Credit
    let paymentRecord = null;
    if (payment > 0) {
      const paymentNumber = await generatePaymentId();
      paymentRecord = await Payment.create({
        paymentNumber,
        customer: customer._id,
        date: releaseDate,
        amount: payment,
        paymentMethod: 'Cash',
        referenceNumber: releaseNumber,
        relatedLot: lot._id,
        remarks: `Payment received at stock release ${releaseNumber}`,
      });

      await Transaction.create({
        customer: customer._id,
        date: releaseDate,
        transactionType: 'Payment',
        reference: paymentNumber,
        debit: 0,
        credit: payment,
        balance: newBalance,
        remarks: `Payment at release ${releaseNumber}`,
      });
    }

    // 6. Create StockRelease record
    const stockRelease = await StockRelease.create({
      releaseNumber,
      receiptNumber,
      releaseDate,
      lot: lot._id,
      customer: customer._id,
      chamber: lot.chamber._id,
      commodity: lot.commodity._id,
      availableQuantity: lot.remainingQuantity + qty,
      releaseQuantity: qty,
      remainingQuantity: lot.remainingQuantity,
      storageDays: chargeCalc.days,
      storageMonths: chargeCalc.months,
      calculatedCharges,
      actualCharges,
      previousBalance,
      paymentReceived: payment,
      remainingBalance: newBalance,
      vehicleNumber,
      remarks,
    });

    // 7. Log Activity
    await ActivityLog.create({
      type: 'RELEASE',
      title: 'Stock Released',
      description: `${qty} ${lot.commodity.unit}s released for ${customer.name} (Lot: ${lot.lotNumber}). Charges: ₹${actualCharges}, Payment: ₹${payment}`,
      meta: { releaseNumber, lotNumber: lot.lotNumber, customerName: customer.name, releaseQuantity: qty },
    });

    const settings = await Settings.findOne() || {};

    res.status(201).json({
      success: true,
      message: 'Stock released successfully',
      data: {
        stockRelease,
        lot,
        receipt: {
          company: settings,
          releaseNumber,
          receiptNumber,
          lotNumber: lot.lotNumber,
          releaseDate,
          customer: {
            id: customer._id,
            customerId: customer.customerId,
            name: customer.name,
            mobile: customer.mobile,
            village: customer.village,
            district: customer.district,
          },
          commodity: {
            name: lot.commodity.name,
            unit: lot.commodity.unit,
          },
          chamber: {
            name: lot.chamber.name,
            code: lot.chamber.chamberCode,
          },
          releaseQuantity: qty,
          remainingQuantity: lot.remainingQuantity,
          storageDays: chargeCalc.days,
          storageMonths: chargeCalc.months,
          calculationFormula: chargeCalc.calculationFormula,
          storageCharges: actualCharges,
          previousBalance,
          paymentReceived: payment,
          remainingBalance: newBalance,
          vehicleNumber,
          remarks,
        },
      },
    });
  } catch (error) {
    console.error('createStockRelease error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getStockReleases = async (req, res) => {
  try {
    const { search = '', customer, commodity, page = 1, limit = 50 } = req.query;
    const query = {};

    if (customer && customer !== 'All') query.customer = customer;
    if (commodity && commodity !== 'All') query.commodity = commodity;

    if (search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { releaseNumber: regex },
        { receiptNumber: regex },
        { vehicleNumber: regex },
      ];
    }

    const total = await StockRelease.countDocuments(query);
    const releases = await StockRelease.find(query)
      .populate('customer', 'name mobile customerId')
      .populate('commodity', 'name unit')
      .populate('chamber', 'name chamberCode')
      .populate('lot', 'lotNumber entryDate')
      .sort({ releaseDate: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      data: releases,
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

module.exports = {
  createStockInward,
  getStockInwardEntries,
  previewStorageCharges,
  createStockRelease,
  getStockReleases,
};
