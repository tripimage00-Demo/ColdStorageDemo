const express = require('express');
const router = express.Router();
const { getCustomerLedger, createAdjustment } = require('../controllers/ledgerController');
const authMiddleware = require('../middleware/auth');

router.get('/:customerId', authMiddleware, getCustomerLedger);
router.post('/adjustment', authMiddleware, createAdjustment);

module.exports = router;
