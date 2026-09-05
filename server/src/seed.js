const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

const User = require('./models/User');
const Settings = require('./models/Settings');
const Chamber = require('./models/Chamber');
const Commodity = require('./models/Commodity');
const Customer = require('./models/Customer');
const StockEntry = require('./models/StockEntry');
const Lot = require('./models/Lot');
const StockRelease = require('./models/StockRelease');
const Payment = require('./models/Payment');
const Transaction = require('./models/Transaction');
const ActivityLog = require('./models/ActivityLog');

dotenv.config();

const seedDatabase = async () => {
  try {
    console.log('--- Connecting to database for seeding ---');
    await connectDB();

    console.log('--- Clearing existing Cold Storage demo data ---');
    await Promise.all([
      User.deleteMany({}),
      Settings.deleteMany({}),
      Chamber.deleteMany({}),
      Commodity.deleteMany({}),
      Customer.deleteMany({}),
      StockEntry.deleteMany({}),
      Lot.deleteMany({}),
      StockRelease.deleteMany({}),
      Payment.deleteMany({}),
      Transaction.deleteMany({}),
      ActivityLog.deleteMany({}),
    ]);

    // 1. Seed Demo User
    console.log('Seeding Demo User...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    await User.create({
      name: 'Cold Storage Administrator',
      email: 'admin@coldstorage.com',
      password: hashedPassword,
      role: 'ADMIN',
    });

    // 2. Seed Settings
    console.log('Seeding Company Settings...');
    await Settings.create({
      companyName: 'SmartCold Storage Management',
      tagline: 'Simple Storage. Better Control.',
      ownerName: 'Rajesh Agarwal',
      address: 'NH-19 Agra Highway Bypass, Sikandra, Agra, Uttar Pradesh - 282007',
      phone: '+91 98765 43210',
      email: 'admin@coldstorage.com',
      gstNumber: '09AAACS1234F1Z5',
      defaultStorageRate: 20,
      currency: '₹',
    });

    // 3. Seed Chambers: 90,000 total capacity, 62,500 occupied (69.4%)
    console.log('Seeding Chambers (90,000 Total Capacity)...');
    const chambers = await Chamber.create([
      {
        name: 'Chamber A',
        chamberCode: 'CH-A',
        maxCapacity: 30000,
        currentOccupancy: 22000,
        temperature: -2.5,
        status: 'Active',
        description: 'Sub-zero controlled atmosphere chamber for potatoes and roots',
      },
      {
        name: 'Chamber B',
        chamberCode: 'CH-B',
        maxCapacity: 35000,
        currentOccupancy: 25500,
        temperature: 1.0,
        status: 'Active',
        description: 'Multi-commodity commercial cold storage with humidity regulation',
      },
      {
        name: 'Chamber C',
        chamberCode: 'CH-C',
        maxCapacity: 25000,
        currentOccupancy: 15000,
        temperature: 3.2,
        status: 'Active',
        description: 'Chilled fruit & seasonal vegetable section with air circulation',
      },
    ]);

    // 4. Seed Commodities
    console.log('Seeding Commodities...');
    const commodities = await Commodity.create([
      {
        name: 'Kufri Jyoti Potato',
        code: 'COMM-POT-01',
        storageRate: 20,
        rateType: 'per_bag',
        unit: 'Bag',
        description: 'Standard Grade-A processing potato (50kg bags)',
      },
      {
        name: 'Red Nasik Onion',
        code: 'COMM-ONI-01',
        storageRate: 15,
        rateType: 'per_month',
        unit: 'Bag',
        description: 'Medium dry red onions (40kg mesh bags)',
      },
      {
        name: 'Royal Delicious Apple',
        code: 'COMM-APP-01',
        storageRate: 35,
        rateType: 'per_month',
        unit: 'Crate',
        description: 'Kinnaur Himachal crisp apples in ventilated crates (20kg)',
      },
      {
        name: 'Garlic Supreme',
        code: 'COMM-GAR-01',
        storageRate: 25,
        rateType: 'per_month',
        unit: 'Bag',
        description: 'Sun-cured white garlic bulbs',
      },
      {
        name: 'Fresh Carrots',
        code: 'COMM-CAR-01',
        storageRate: 18,
        rateType: 'per_month',
        unit: 'Box',
        description: 'Hydro-cooled red winter carrots',
      },
    ]);

    // 5. Seed Customers
    console.log('Seeding Customers...');
    const customers = await Customer.create([
      {
        customerId: 'CUST-2026-0001',
        name: 'Rajesh Kumar',
        mobile: '9876543210',
        altMobile: '9876500001',
        address: 'Plot 14, Mandi Samiti Road',
        village: 'Khandari',
        district: 'Agra',
        state: 'Uttar Pradesh',
        gstNumber: '09AAKPR1122D1Z3',
        notes: 'Major potato grower; requires weekly inward updates',
        outstandingBalance: 25000,
      },
      {
        customerId: 'CUST-2026-0002',
        name: 'Amit Traders',
        mobile: '9823456789',
        altMobile: '9823400002',
        address: 'Shop 42, Galla Mandi',
        village: 'Collectorganj',
        district: 'Kanpur',
        state: 'Uttar Pradesh',
        gstNumber: '09BBQAT3344E1Z4',
        notes: 'Commercial wholesale trader dealing in onions and garlic',
        outstandingBalance: 18000,
      },
      {
        customerId: 'CUST-2026-0003',
        name: 'Sharma Farms',
        mobile: '9711223344',
        altMobile: '9711200003',
        address: 'GT Road Near Grain Market',
        village: 'Rampura',
        district: 'Bathinda',
        state: 'Punjab',
        gstNumber: '03CCPSF5566F1Z5',
        notes: 'Long-term storage partner; seasonal potato contract',
        outstandingBalance: 34500,
      },
      {
        customerId: 'CUST-2026-0004',
        name: 'Gupta Agro Produce',
        mobile: '9655443322',
        altMobile: '9655400004',
        address: 'Krishi Upaj Mandi Complex',
        village: 'Sasni Gate',
        district: 'Aligarh',
        state: 'Uttar Pradesh',
        gstNumber: '09DDGAA7788G1Z6',
        notes: 'Zero pending dues; always clears balance on release',
        outstandingBalance: 0,
      },
      {
        customerId: 'CUST-2026-0005',
        name: 'Kisan Foods & Logistics',
        mobile: '9544332211',
        altMobile: '9544300005',
        address: 'National Highway 2',
        village: 'Farah',
        district: 'Mathura',
        state: 'Uttar Pradesh',
        gstNumber: '09EEKFL9900H1Z7',
        notes: 'Supplies to retail supermarket chains in Delhi NCR',
        outstandingBalance: 12000,
      },
    ]);

    // 6. Seed Inward Stock Entries & Lots
    console.log('Seeding Inward Stock & Lots...');
    const now = new Date();
    const daysAgo = (days) => {
      const d = new Date(now);
      d.setDate(d.getDate() - days);
      return d;
    };

    const lotDefinitions = [
      {
        entryNum: 'IN-2026-0001',
        rcpNum: 'RCP-2026-0001',
        lotNum: 'LOT-2026-0001',
        custIdx: 0, // Rajesh Kumar
        commIdx: 0, // Potato
        chIdx: 0, // Chamber A
        qty: 12000,
        date: daysAgo(45),
        vehicle: 'UP-80-AT-1024',
        driver: 'Mahesh Yadav',
        released: 2000,
        status: 'Partially Released',
      },
      {
        entryNum: 'IN-2026-0002',
        rcpNum: 'RCP-2026-0002',
        lotNum: 'LOT-2026-0002',
        custIdx: 2, // Sharma Farms
        commIdx: 0, // Potato
        chIdx: 0, // Chamber A
        qty: 12000,
        date: daysAgo(30),
        vehicle: 'PB-03-BC-5544',
        driver: 'Gurpreet Singh',
        released: 0,
        status: 'Stored',
      },
      {
        entryNum: 'IN-2026-0003',
        rcpNum: 'RCP-2026-0003',
        lotNum: 'LOT-2026-0003',
        custIdx: 1, // Amit Traders
        commIdx: 1, // Onion
        chIdx: 1, // Chamber B
        qty: 15000,
        date: daysAgo(20),
        vehicle: 'UP-78-DF-9988',
        driver: 'Ramesh Pal',
        released: 3000,
        status: 'Partially Released',
      },
      {
        entryNum: 'IN-2026-0004',
        rcpNum: 'RCP-2026-0004',
        lotNum: 'LOT-2026-0004',
        custIdx: 3, // Gupta Agro
        commIdx: 3, // Garlic
        chIdx: 1, // Chamber B
        qty: 13500,
        date: daysAgo(15),
        vehicle: 'UP-81-GH-3321',
        driver: 'Suresh Chandra',
        released: 0,
        status: 'Stored',
      },
      {
        entryNum: 'IN-2026-0005',
        rcpNum: 'RCP-2026-0005',
        lotNum: 'LOT-2026-0005',
        custIdx: 4, // Kisan Foods
        commIdx: 2, // Apple
        chIdx: 2, // Chamber C
        qty: 10000,
        date: daysAgo(10),
        vehicle: 'HP-12-JK-4455',
        driver: 'Virender Thakur',
        released: 0,
        status: 'Stored',
      },
      {
        entryNum: 'IN-2026-0006',
        rcpNum: 'RCP-2026-0006',
        lotNum: 'LOT-2026-0006',
        custIdx: 0, // Rajesh Kumar
        commIdx: 4, // Carrot
        chIdx: 2, // Chamber C
        qty: 5000,
        date: daysAgo(2),
        vehicle: 'UP-80-LM-7700',
        driver: 'Dinesh Tyagi',
        released: 0,
        status: 'Stored',
      },
    ];

    for (const item of lotDefinitions) {
      const cust = customers[item.custIdx];
      const comm = commodities[item.commIdx];
      const ch = chambers[item.chIdx];

      const entry = await StockEntry.create({
        entryNumber: item.entryNum,
        receiptNumber: item.rcpNum,
        lotNumber: item.lotNum,
        date: item.date,
        customer: cust._id,
        commodity: comm._id,
        chamber: ch._id,
        quantity: item.qty,
        weightPerPacket: 50,
        totalWeight: item.qty * 50,
        storageRate: comm.storageRate,
        rateType: comm.rateType,
        vehicleNumber: item.vehicle,
        driverName: item.driver,
        qualityGrade: 'Grade A',
        remarks: 'Cold storage intake inspected and verified',
      });

      await Lot.create({
        lotNumber: item.lotNum,
        stockEntry: entry._id,
        customer: cust._id,
        commodity: comm._id,
        chamber: ch._id,
        entryDate: item.date,
        originalQuantity: item.qty,
        remainingQuantity: item.qty - item.released,
        releasedQuantity: item.released,
        storageRate: comm.storageRate,
        rateType: comm.rateType,
        status: item.status,
        remarks: 'Active lot in temperature controlled atmosphere',
      });
    }

    // 7. Seed Stock Releases
    console.log('Seeding Stock Releases...');
    const lot1 = await Lot.findOne({ lotNumber: 'LOT-2026-0001' });
    const lot3 = await Lot.findOne({ lotNumber: 'LOT-2026-0003' });

    await StockRelease.create([
      {
        releaseNumber: 'OUT-2026-0001',
        receiptNumber: 'REL-2026-0001',
        releaseDate: daysAgo(5),
        lot: lot1._id,
        customer: customers[0]._id,
        chamber: chambers[0]._id,
        commodity: commodities[0]._id,
        availableQuantity: 12000,
        releaseQuantity: 2000,
        remainingQuantity: 10000,
        storageDays: 40,
        storageMonths: 2,
        calculatedCharges: 40000,
        actualCharges: 40000,
        previousBalance: 0,
        paymentReceived: 15000,
        remainingBalance: 25000,
        vehicleNumber: 'UP-80-XY-5511',
        remarks: 'Partial release of 2,000 potato bags for wholesale distribution',
      },
      {
        releaseNumber: 'OUT-2026-0002',
        receiptNumber: 'REL-2026-0002',
        releaseDate: daysAgo(3),
        lot: lot3._id,
        customer: customers[1]._id,
        chamber: chambers[1]._id,
        commodity: commodities[1]._id,
        availableQuantity: 15000,
        releaseQuantity: 3000,
        remainingQuantity: 12000,
        storageDays: 17,
        storageMonths: 1,
        calculatedCharges: 45000,
        actualCharges: 45000,
        previousBalance: 0,
        paymentReceived: 27000,
        remainingBalance: 18000,
        vehicleNumber: 'UP-78-ZZ-9090',
        remarks: 'Partial onion release for Azadpur mandi supply',
      },
    ]);

    // 8. Seed Payments
    console.log('Seeding Payments...');
    await Payment.create([
      {
        paymentNumber: 'PAY-2026-0001',
        customer: customers[0]._id,
        date: daysAgo(5),
        amount: 15000,
        paymentMethod: 'UPI',
        referenceNumber: 'UPI/628192839211',
        relatedLot: lot1._id,
        remarks: 'Advance payment on partial stock release',
      },
      {
        paymentNumber: 'PAY-2026-0002',
        customer: customers[1]._id,
        date: daysAgo(3),
        amount: 27000,
        paymentMethod: 'Bank Transfer',
        referenceNumber: 'NEFT/HDFC/9091823',
        relatedLot: lot3._id,
        remarks: 'Payment cleared for release OUT-2026-0002',
      },
      {
        paymentNumber: 'PAY-2026-0003',
        customer: customers[2]._id,
        date: daysAgo(12),
        amount: 50000,
        paymentMethod: 'Cheque',
        referenceNumber: 'CHQ-881920',
        remarks: 'Seasonal storage advance deposit',
      },
      {
        paymentNumber: 'PAY-2026-0004',
        customer: customers[4]._id,
        date: daysAgo(1),
        amount: 18000,
        paymentMethod: 'Cash',
        referenceNumber: 'CSH-REC-004',
        remarks: 'Cash receipt at cold storage counter',
      },
    ]);

    // 9. Seed Ledger Transactions
    console.log('Seeding Ledger Transactions...');
    await Transaction.create([
      {
        customer: customers[0]._id,
        date: daysAgo(5),
        transactionType: 'Storage Charge',
        reference: 'OUT-2026-0001',
        debit: 40000,
        credit: 0,
        balance: 40000,
        remarks: 'Storage charges for 2,000 potato bags',
      },
      {
        customer: customers[0]._id,
        date: daysAgo(5),
        transactionType: 'Payment',
        reference: 'PAY-2026-0001',
        debit: 0,
        credit: 15000,
        balance: 25000,
        remarks: 'Payment received via UPI',
      },
      {
        customer: customers[1]._id,
        date: daysAgo(3),
        transactionType: 'Storage Charge',
        reference: 'OUT-2026-0002',
        debit: 45000,
        credit: 0,
        balance: 45000,
        remarks: 'Storage charges for 3,000 onion bags',
      },
      {
        customer: customers[1]._id,
        date: daysAgo(3),
        transactionType: 'Payment',
        reference: 'PAY-2026-0002',
        debit: 0,
        credit: 27000,
        balance: 18000,
        remarks: 'Payment received via Bank Transfer',
      },
    ]);

    // 10. Seed Activity Log
    console.log('Seeding Activity Logs...');
    await ActivityLog.create([
      {
        type: 'INWARD',
        title: '5,000 Carrot Boxes Stored',
        description: '5,000 boxes received from Rajesh Kumar (Lot: LOT-2026-0006, Chamber C)',
        createdAt: daysAgo(2),
      },
      {
        type: 'RELEASE',
        title: '3,000 Onion Packets Released',
        description: '3,000 packets released for Amit Traders (OUT-2026-0002). ₹27,000 payment collected.',
        createdAt: daysAgo(3),
      },
      {
        type: 'PAYMENT',
        title: '₹15,000 Payment Received',
        description: 'Payment collected from Rajesh Kumar via UPI (Ref: PAY-2026-0001)',
        createdAt: daysAgo(5),
      },
      {
        type: 'RELEASE',
        title: '2,000 Potato Bags Released',
        description: '2,000 bags released for Rajesh Kumar (OUT-2026-0001)',
        createdAt: daysAgo(5),
      },
      {
        type: 'INWARD',
        title: '10,000 Apple Crates Received',
        description: '10,000 crates received from Kisan Foods & Logistics (Chamber C)',
        createdAt: daysAgo(10),
      },
    ]);

    console.log('=====================================================');
    console.log(' Cold Storage Demo Database Seeded Successfully!');
    console.log(' Demo Login: admin@coldstorage.com / admin123');
    console.log(' Total Capacity: 90,000 Packets');
    console.log(' Occupied: 62,500 Packets (~69.4% Occupancy)');
    console.log(' Available: 27,500 Packets');
    console.log(' Customers: 5 | Commodities: 5 | Chambers: 3');
    console.log('=====================================================');

    process.exit(0);
  } catch (error) {
    console.error('Database seed error:', error);
    process.exit(1);
  }
};

seedDatabase();
