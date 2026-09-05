const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} = require('../controllers/customerController');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, getCustomers);
router.get('/:id', authMiddleware, getCustomerById);
router.post('/', authMiddleware, createCustomer);
router.put('/:id', authMiddleware, updateCustomer);
router.delete('/:id', authMiddleware, deleteCustomer);

module.exports = router;
