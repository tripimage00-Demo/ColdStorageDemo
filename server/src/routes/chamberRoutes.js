const express = require('express');
const router = express.Router();
const {
  getChambers,
  getChamberById,
  createChamber,
  updateChamber,
  deleteChamber,
} = require('../controllers/chamberController');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, getChambers);
router.get('/:id', authMiddleware, getChamberById);
router.post('/', authMiddleware, createChamber);
router.put('/:id', authMiddleware, updateChamber);
router.delete('/:id', authMiddleware, deleteChamber);

module.exports = router;
