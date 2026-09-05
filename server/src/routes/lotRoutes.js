const express = require('express');
const router = express.Router();
const { getLots, getLotById } = require('../controllers/lotController');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, getLots);
router.get('/:id', authMiddleware, getLotById);

module.exports = router;
