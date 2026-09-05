const express = require('express');
const router = express.Router();
const {
  getStockReports,
  getFinancialReports,
  getCapacityReports,
} = require('../controllers/reportController');
const authMiddleware = require('../middleware/auth');

router.get('/stock', authMiddleware, getStockReports);
router.get('/financial', authMiddleware, getFinancialReports);
router.get('/capacity', authMiddleware, getCapacityReports);

module.exports = router;
