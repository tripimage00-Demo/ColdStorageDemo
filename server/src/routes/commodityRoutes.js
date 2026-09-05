const express = require('express');
const router = express.Router();
const {
  getCommodities,
  getCommodityById,
  createCommodity,
  updateCommodity,
  deleteCommodity,
} = require('../controllers/commodityController');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, getCommodities);
router.get('/:id', authMiddleware, getCommodityById);
router.post('/', authMiddleware, createCommodity);
router.put('/:id', authMiddleware, updateCommodity);
router.delete('/:id', authMiddleware, deleteCommodity);

module.exports = router;
