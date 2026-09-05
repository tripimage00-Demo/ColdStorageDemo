const express = require('express');
const router = express.Router();
const { createPayment, getPayments, getPaymentById } = require('../controllers/paymentController');
const authMiddleware = require('../middleware/auth');

router.post('/', authMiddleware, createPayment);
router.get('/', authMiddleware, getPayments);
router.get('/:id', authMiddleware, getPaymentById);

module.exports = router;
