const express = require('express');
const router = express.Router();
const {
  createStockInward,
  getStockInwardEntries,
  previewStorageCharges,
  createStockRelease,
  getStockReleases,
} = require('../controllers/stockController');
const authMiddleware = require('../middleware/auth');

// Inward routes
router.post('/inward', authMiddleware, createStockInward);
router.get('/inward', authMiddleware, getStockInwardEntries);

// Outward / Release routes
router.post('/preview-charges', authMiddleware, previewStorageCharges);
router.post('/outward', authMiddleware, createStockRelease);
router.get('/outward', authMiddleware, getStockReleases);

module.exports = router;
