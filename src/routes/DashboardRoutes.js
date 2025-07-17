const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/DashboardController');

// Lesson Reports
router.get('/count-stats', DashboardController.getDashboardStats);

module.exports = router;