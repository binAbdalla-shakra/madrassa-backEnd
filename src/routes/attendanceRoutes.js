const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

// Individual attendance routes
router.post('/', attendanceController.createAttendance);
router.get('/', attendanceController.getAttendance);
router.put('/:id', attendanceController.updateAttendance);

// Bulk attendance route
router.post('/bulk', attendanceController.createBulkAttendance);

module.exports = router;
