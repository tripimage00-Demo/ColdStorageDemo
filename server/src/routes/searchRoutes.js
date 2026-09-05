const express = require('express');
const router = express.Router();
const { globalSearch } = require('../controllers/searchController');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, globalSearch);

module.exports = router;
